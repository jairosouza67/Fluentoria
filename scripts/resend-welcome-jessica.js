// One-off: reenvia o email de boas-vindas para a Jéssica via Resend.
// A chave vem da env RESEND_API_KEY (injetada pelo caller, nunca hardcoded).
const https = require('https');

const TO = 'jessicaandradyy@hotmail.com';
const NAME = 'Jéssica Cristine vieira Andrade';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('RESEND_API_KEY não definida no ambiente.');
  process.exit(1);
}

const escapeHtml = (s) => String(s || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#39;');

const safeName = escapeHtml(NAME);
const safeEmail = escapeHtml(TO);

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0B0B0B;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0B0B;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" width="80" height="80" style="width:80px;height:80px;background-color:#22c55e33;border-radius:50%;font-size:40px;color:#22c55e;font-weight:bold;line-height:80px;">&#10003;</td>
                </tr>
              </table>
              <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:24px 0 12px 0;line-height:1.3;">Compra Realizada com Sucesso! &#127881;</h1>
              <p style="color:#9ca3af;font-size:16px;margin:0;line-height:1.5;">Parab&eacute;ns, ${safeName}! Voc&ecirc; est&aacute; a um passo de come&ccedil;ar sua jornada no ingl&ecirc;s.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FF6A00;border-radius:16px;padding:2px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:14px;">
                <tr>
                  <td style="padding:28px 24px;">
                    <h2 style="color:#ffffff;font-size:20px;font-weight:bold;margin:0 0 24px 0;">&#128241; Como Acessar o App</h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td valign="top" width="32" style="width:32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                            <td align="center" width="32" height="32" style="width:32px;height:32px;background-color:#FF6A00;border-radius:50%;color:#ffffff;font-weight:bold;font-size:14px;line-height:32px;">1</td>
                          </tr></table>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="color:#ffffff;font-size:15px;font-weight:bold;margin:6px 0 4px 0;">Acesse a Plataforma</p>
                          <p style="color:#9ca3af;font-size:14px;margin:0;line-height:1.5;">Clique no bot&atilde;o abaixo para acessar o aplicativo web da Fluentoria.</p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td valign="top" width="32" style="width:32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                            <td align="center" width="32" height="32" style="width:32px;height:32px;background-color:#FF6A00;border-radius:50%;color:#ffffff;font-weight:bold;font-size:14px;line-height:32px;">2</td>
                          </tr></table>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="color:#ffffff;font-size:15px;font-weight:bold;margin:6px 0 4px 0;">Crie sua Conta</p>
                          <p style="color:#9ca3af;font-size:14px;margin:0 0 8px 0;line-height:1.5;">Na tela de cadastro, preencha:</p>
                          <p style="color:#d1d5db;font-size:14px;margin:0 0 6px 0;line-height:1.5;"><strong>Email:</strong> Use <span style="color:#FF6A00;font-weight:bold;">${safeEmail}</span> (o mesmo email da compra)</p>
                          <p style="color:#d1d5db;font-size:14px;margin:0 0 6px 0;line-height:1.5;"><strong>Nome:</strong> Seu nome completo</p>
                          <p style="color:#d1d5db;font-size:14px;margin:0;line-height:1.5;"><strong>Senha:</strong> Crie uma senha segura</p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td valign="top" width="32" style="width:32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                            <td align="center" width="32" height="32" style="width:32px;height:32px;background-color:#FF6A00;border-radius:50%;color:#ffffff;font-weight:bold;font-size:14px;line-height:32px;">3</td>
                          </tr></table>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="color:#ffffff;font-size:15px;font-weight:bold;margin:6px 0 4px 0;">Aproveite!</p>
                          <p style="color:#9ca3af;font-size:14px;margin:0;line-height:1.5;">Ap&oacute;s criar sua conta, voc&ecirc; ter&aacute; acesso completo a todas as funcionalidades do seu plano.</p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FF6A001A;border:1px solid #FF6A004D;border-radius:12px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="color:#FF6A00;font-size:14px;font-weight:bold;margin:0 0 4px 0;">Importante!</p>
                          <p style="color:#d1d5db;font-size:14px;margin:0;line-height:1.5;">&Eacute; essencial que voc&ecirc; use o <strong>mesmo email utilizado na compra</strong> para criar sua conta. Isso garante que seu plano seja ativado automaticamente.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 0 8px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#FF6A00;border-radius:12px;">
                    <a href="https://app.fluentoria.com.br/" target="_blank" style="display:inline-block;padding:16px 32px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">Acessar o App Agora &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="color:#6b7280;font-size:13px;margin:16px 0 0 0;">Guarde este email &mdash; ele &eacute; sua chave de acesso.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0 8px 0;border-top:1px solid #1f2937;">
              <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.6;">D&uacute;vidas? Fale com a gente no <a href="https://wa.me/557791221346" style="color:#25D366;text-decoration:none;">WhatsApp</a>.</p>
              <p style="color:#4b5563;font-size:12px;margin:8px 0 0 0;">Fluentoria &mdash; Sua jornada no ingl&ecirc;s come&ccedil;a agora.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const payload = JSON.stringify({
  from: 'Fluentoria <boasvindas@fluentoria.com.br>',
  to: [TO],
  subject: 'Bem-vindo(a) à Fluentoria! 🎉',
  html,
});

const req = https.request({
  hostname: 'api.resend.com',
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
}, (res) => {
  let buf = '';
  res.on('data', (c) => buf += c);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`EMAIL ENVIADO com sucesso para ${TO} (HTTP ${res.statusCode})`);
    } else {
      console.error(`FALHA ao enviar (HTTP ${res.statusCode}): ${buf}`);
      process.exit(1);
    }
  });
});
req.on('error', (e) => { console.error('Erro de rede:', e.message); process.exit(1); });
req.write(payload);
req.end();
