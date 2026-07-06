#!/usr/bin/env python3
"""
FLUENTORIA — Migração Google Drive → YouTube
=============================================
Script único. Roda em qualquer máquina com Python 3.
Instala dependências automaticamente. Abre o navegador pra autorizar.
Tudo em português.

USO:
  1. Coloque os arquivos na mesma pasta:
     - service-account-key.json (peça ao programador)
     - credentials.json (peça ao programador)
  2. Execute:  python3 migrar.py
  3. Autorize no navegador quando abrir
  4. Pronto.

Se não tiver os arquivos, o script cria um passo a passo pra conseguir.
"""

import subprocess
import sys
import os
import json
import time
import tempfile
import shutil
import webbrowser
from pathlib import Path

# ─── Tenta importar, instala se faltar ───────────────────────────
def instalar_se_faltar(pacote, nome_import=None):
    nome_import = nome_import or pacote.replace("-", "_")
    try:
        __import__(nome_import)
        return True
    except ImportError:
        print(f"\n📦 Instalando {pacote}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pacote, "-q"])
        return True

print("🔍 Verificando dependências...")
instalar_se_faltar("firebase-admin", "firebase_admin")
instalar_se_faltar("google-api-python-client", "googleapiclient")
instalar_se_faltar("google-auth-oauthlib", "google_auth_oauthlib")
instalar_se_faltar("google-auth-httplib2")

import google.auth
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import firebase_admin
from firebase_admin import credentials, firestore

# ─── CONFIGURAÇÃO ────────────────────────────────────────────────
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/drive.readonly",
]
SCRIPT_DIR = Path(__file__).parent
CREDENTIALS_PATH = SCRIPT_DIR / "credentials.json"
TOKEN_PATH = SCRIPT_DIR / "token.json"
SERVICE_ACCOUNT_PATH = SCRIPT_DIR / "service-account-key.json"
BACKUP_PATH = SCRIPT_DIR / "backup-antes-da-migracao.json"
RESULTS_PATH = SCRIPT_DIR / "resultado-migracao.json"
TEMP_DIR = SCRIPT_DIR / "temp-videos"
DELAY_ENTRE_UPLOADS = 10  # segundos (YouTube limita ~6/min)


# ═══════════════════════════════════════════════════════════════════
# ETAPA 1: GUIAR O USUÁRIO A OBTER OS ARQUIVOS
# ═══════════════════════════════════════════════════════════════════

def guiar_credentials():
    print("\n" + "=" * 60)
    print("📋 PRECISAMOS DE 2 ARQUIVOS")
    print("=" * 60)

    if not CREDENTIALS_PATH.exists():
        print("""
❌ Faltando: credentials.json

👉 Peça ao seu programador este arquivo.
   Ele gera no Google Cloud Console.
   Coloque na pasta: scripts/

   OU siga você mesmo:
   1. https://console.cloud.google.com/apis/credentials
   2. + Criar credenciais → ID do cliente OAuth → App para computador
   3. Baixar JSON → renomear para credentials.json
""")
    else:
        print("✅ credentials.json encontrado")

    if not SERVICE_ACCOUNT_PATH.exists():
        print("""
❌ Faltando: service-account-key.json

👉 Peça ao seu programador este arquivo.
   Ele gera no Firebase Console → Contas de Serviço.
   Coloque na pasta: scripts/
""")
    else:
        print("✅ service-account-key.json encontrado")

    if not CREDENTIALS_PATH.exists() or not SERVICE_ACCOUNT_PATH.exists():
        print("\nColoque os arquivos nesta pasta e execute novamente.")
        sys.exit(1)

    print("\n✅ Todos os arquivos encontrados!\n")


# ═══════════════════════════════════════════════════════════════════
# ETAPA 2: AUTENTICAR NO GOOGLE (Drive + YouTube)
# ═══════════════════════════════════════════════════════════════════

def autenticar_google():
    creds = None

    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Atualizando token...")
            creds.refresh(Request())
        else:
            print("\n🔐 ABRINDO NAVEGADOR PARA AUTORIZAÇÃO...")
            print("   Autorize com a conta Google que tem os vídeos no Drive")
            print("   e o canal do YouTube.\n")

            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
            # Abre o navegador automaticamente
            webbrowser.open("http://localhost:8080/")
            creds = flow.run_local_server(port=8080, open_browser=True)

        TOKEN_PATH.write_text(creds.to_json())
        print("✅ Autorizado com sucesso!\n")

    return creds


# ═══════════════════════════════════════════════════════════════════
# ETAPA 3: CONECTAR NO FIREBASE
# ═══════════════════════════════════════════════════════════════════

def conectar_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
        firebase_admin.initialize_app(cred)
    return firestore.client()


# ═══════════════════════════════════════════════════════════════════
# ETAPA 4: ENCONTRAR VÍDEOS DO DRIVE NO FIRESTORE
# ═══════════════════════════════════════════════════════════════════

def encontrar_aulas_drive(db):
    print("🔍 Procurando aulas com vídeos no Google Drive...")
    docs = db.collection("courses").get()
    if not docs:
        print("❌ Nenhum curso encontrado no Firestore")
        sys.exit(1)

    aulas = []
    for doc in docs:
        curso = {"id": doc.id, **doc.to_dict()}

        # Courses com módulos/galleries
        for galeria in (curso.get("galleries") or []):
            for modulo in (galeria.get("modules") or []):
                for aula in (modulo.get("lessons") or []):
                    url = aula.get("videoUrl", "")
                    file_id = extrair_drive_id(url)
                    if file_id:
                        aulas.append({
                            "curso_id": doc.id,
                            "curso_titulo": curso.get("title", ""),
                            "galeria_id": galeria.get("id"),
                            "modulo_id": modulo.get("id"),
                            "aula_id": aula.get("id"),
                            "aula_titulo": aula.get("title", ""),
                            "drive_url": url,
                            "drive_id": file_id,
                            "tipo": "aula",
                        })

        # Courses diretos (mindful/music) com videoUrl no próprio curso
        url_direto = curso.get("videoUrl", "")
        file_id_direto = extrair_drive_id(url_direto)
        if file_id_direto:
            aulas.append({
                "curso_id": doc.id,
                "curso_titulo": curso.get("title", ""),
                "galeria_id": None,
                "modulo_id": None,
                "aula_id": None,
                "aula_titulo": curso.get("title", ""),
                "drive_url": url_direto,
                "drive_id": file_id_direto,
                "tipo": "direto",
            })

    print(f"📊 Encontradas {len(aulas)} aulas com vídeos do Drive\n")
    return aulas


def extrair_drive_id(url):
    if not url or "drive.google.com" not in url:
        return None
    import re
    padroes = [
        r"drive\.google\.com/file/d/([a-zA-Z0-9_-]+)",
        r"drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)",
        r"id=([a-zA-Z0-9_-]{20,})",
    ]
    for p in padroes:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


# ═══════════════════════════════════════════════════════════════════
# ETAPA 5: BACKUP
# ═══════════════════════════════════════════════════════════════════

def criar_backup(db):
    print("💾 Criando backup...")
    docs = db.collection("courses").get()
    dados = {}
    for doc in docs:
        dados[doc.id] = doc.to_dict()
    BACKUP_PATH.write_text(json.dumps(dados, ensure_ascii=False, indent=2))
    print(f"✅ Backup salvo: {BACKUP_PATH} ({len(dados)} cursos)\n")


# ═══════════════════════════════════════════════════════════════════
# ETAPA 6: DOWNLOAD DO DRIVE
# ═══════════════════════════════════════════════════════════════════

def baixar_do_drive(drive_service, drive_id, destino):
    print(f"   📥 Baixando do Drive: {drive_id}")

    # Pega metadados
    arquivo = drive_service.files().get(fileId=drive_id, fields="name,size").execute()
    nome = arquivo.get("name", drive_id)
    tamanho_mb = int(arquivo.get("size", 0)) / (1024 * 1024)
    print(f"      Arquivo: {nome} ({tamanho_mb:.1f} MB)")

    # Download direto (funciona para arquivos compartilhados publicamente)
    request = drive_service.files().get_media(fileId=drive_id)
    with open(destino, "wb") as f:
        f.write(request.execute())

    tamanho_final = os.path.getsize(destino) / (1024 * 1024)
    print(f"   ✅ Download concluído: {tamanho_final:.1f} MB")
    return nome


# ═══════════════════════════════════════════════════════════════════
# ETAPA 7: UPLOAD PARA YOUTUBE
# ═══════════════════════════════════════════════════════════════════

def subir_para_youtube(youtube, video_path, titulo, curso_titulo, modulo_titulo=None):
    titulo_final = (titulo or curso_titulo or "Aula Fluentoria")[:100]
    descricao = f"Aula do curso: {curso_titulo}\n"
    if modulo_titulo:
        descricao += f"Módulo: {modulo_titulo}\n"
    descricao += "\nMigrado automaticamente do Google Drive. App Fluentoria."

    print(f"   📤 Enviando para YouTube: \"{titulo_final}\"")

    body = {
        "snippet": {
            "title": titulo_final,
            "description": descricao[:5000],
            "tags": ["Fluentoria", "aula"],
            "categoryId": "27",  # Educação
        },
        "status": {
            "privacyStatus": "unlisted",  # Não listado
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(video_path, mimetype="video/*", resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    resposta = None
    while resposta is None:
        status, resposta = request.next_chunk()
        if status:
            print(f"      Progresso: {int(status.progress() * 100)}%")

    youtube_id = resposta["id"]
    youtube_url = f"https://www.youtube.com/watch?v={youtube_id}"
    print(f"   ✅ Upload concluído: {youtube_url}")
    return youtube_url


# ═══════════════════════════════════════════════════════════════════
# ETAPA 8: ATUALIZAR FIRESTORE
# ═══════════════════════════════════════════════════════════════════

def atualizar_firestore(db, aula, youtube_url):
    doc_ref = db.collection("courses").document(aula["curso_id"])
    doc = doc_ref.get()
    if not doc.exists:
        print(f"   ⚠️ Curso {aula['curso_id']} não encontrado")
        return False

    curso = doc.to_dict()

    if aula["tipo"] == "aula":
        galleries = list(curso.get("galleries") or [])
        for g in galleries:
            if g.get("id") == aula["galeria_id"]:
                for m in g.get("modules") or []:
                    if m.get("id") == aula["modulo_id"]:
                        for l in m.get("lessons") or []:
                            if l.get("id") == aula["aula_id"]:
                                l["videoUrl"] = youtube_url
        doc_ref.update({"galleries": galleries})
    else:
        doc_ref.update({"videoUrl": youtube_url})

    print(f"   📝 Firestore atualizado: {aula['aula_titulo']}")
    return True


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("🚀 FLUENTORIA — Migração Google Drive → YouTube")
    print("=" * 60)

    # 1. Verificar arquivos
    guiar_credentials()

    # 2. Autenticar Google (Drive + YouTube)
    google_creds = autenticar_google()
    youtube = build("youtube", "v3", credentials=google_creds)
    drive = build("drive", "v3", credentials=google_creds)

    # 3. Conectar Firestore
    db = conectar_firebase()

    # 4. Backup
    criar_backup(db)

    # 5. Encontrar aulas
    aulas = encontrar_aulas_drive(db)

    if not aulas:
        print("✅ Nenhum vídeo do Drive encontrado. Nada a migrar!")
        return

    print(f"📋 {len(aulas)} aulas serão migradas:\n")
    for i, a in enumerate(aulas):
        print(f"   {i+1}. [{a['curso_titulo']}] {a['aula_titulo']}")

    print("\n🔄 Iniciando migração...\n")
    TEMP_DIR.mkdir(exist_ok=True)

    sucesso, falhas = 0, 0
    resultados = []

    for i, aula in enumerate(aulas):
        prog = f"[{i+1}/{len(aulas)}]"
        print(f"{prog} {aula['aula_titulo'] or aula['curso_titulo']}")

        try:
            # Download do Drive
            video_path = TEMP_DIR / f"{aula['drive_id']}.mp4"
            baixar_do_drive(drive, aula["drive_id"], str(video_path))

            # Upload para YouTube (upload continuável — suporta arquivos grandes)
            youtube_url = subir_para_youtube(
                youtube,
                str(video_path),
                aula["aula_titulo"],
                aula["curso_titulo"],
                aula.get("modulo_titulo"),
            )

            # Atualizar Firestore
            atualizar_firestore(db, aula, youtube_url)

            # Limpar temporário
            try:
                os.unlink(str(video_path))
            except OSError:
                pass

            sucesso += 1
            resultados.append({**aula, "youtube_url": youtube_url, "status": "ok"})
            print(f"   🎉 Concluído!\n")

            # Pausa entre uploads (respeitar limite do YouTube)
            if i < len(aulas) - 1:
                print(f"   ⏳ Aguardando {DELAY_ENTRE_UPLOADS}s...")
                time.sleep(DELAY_ENTRE_UPLOADS)

        except Exception as erro:
            falhas += 1
            print(f"   ❌ ERRO: {erro}\n")
            resultados.append({**aula, "erro": str(erro), "status": "falha"})

    # 6. Resumo
    print("=" * 60)
    print("📊 RESUMO")
    print(f"   ✅ Sucesso: {sucesso}")
    print(f"   ❌ Falhas:  {falhas}")
    print(f"   📁 Total:   {len(aulas)}")
    print(f"\n💾 Resultados: {RESULTS_PATH}")
    print(f"💾 Backup:     {BACKUP_PATH}")

    RESULTS_PATH.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")

    # Limpar temp
    try:
        shutil.rmtree(TEMP_DIR)
    except:
        pass

    if falhas > 0:
        print("\n⚠️  Alguns vídeos falharam. Execute novamente — os já migrados não serão reprocessados.")

    print("\n✅ Pronto! Os vídeos já estão no YouTube e o app foi atualizado.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migração interrompida. Execute novamente para continuar de onde parou.")
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        print("   Verifique sua conexão e tente novamente.")