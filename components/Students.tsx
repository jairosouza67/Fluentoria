import React, { useState, useEffect } from 'react';
import { MoreVertical, Mail, Calendar, Award, TrendingUp, Filter, UserPlus, X, Download, Video, Music, File, Image, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllStudents, Student, getCourses, addStudent } from '../lib/db';
import { getAllStudentMediaGrouped, formatFileSize } from '../lib/media';
import { MediaSubmission } from '../types';
import AnimatedInput from './ui/AnimatedInput';

const Students: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentMedia, setStudentMedia] = useState<{ [date: string]: { [courseId: string]: MediaSubmission[] } }>({});
  const [courses, setCourses] = useState<{ [id: string]: string }>({});
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [expandedDates, setExpandedDates] = useState<{ [date: string]: boolean }>({});
  
  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhoto, setNewStudentPhoto] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    loadStudents();
    loadCourses();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    const fetchedStudents = await getAllStudents();
    console.log('📊 Admin - Students loaded:', fetchedStudents.length, 'students');
    console.log('📊 Students data:', fetchedStudents);
    setStudents(fetchedStudents);
    setLoading(false);
  };

  const loadCourses = async () => {
    const fetchedCourses = await getCourses();
    const coursesMap: { [id: string]: string } = {};
    fetchedCourses.forEach(course => {
      if (course.id) coursesMap[course.id] = course.title;
    });
    setCourses(coursesMap);
  };

  const handleStudentClick = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingMedia(true);
    console.log('🔍 Checking media for student:', student.id, student.name, student.email);
    const media = await getAllStudentMediaGrouped(student.id);
    console.log('📁 Media found:', Object.keys(media).length, 'dates', media);
    setStudentMedia(media);
    setLoadingMedia(false);
    // Expand all dates by default
    const expanded: { [date: string]: boolean } = {};
    Object.keys(media).forEach(date => expanded[date] = true);
    setExpandedDates(expanded);
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      alert('Por favor, preencha nome e email');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStudentEmail)) {
      alert('Por favor, insira um email válido');
      return;
    }

    setAddingStudent(true);
    
    const studentId = await addStudent(
      newStudentName.trim(),
      newStudentEmail.trim(),
      newStudentPhoto.trim() || undefined
    );

    if (studentId) {
      alert('Aluno adicionado com sucesso!');
      setShowAddModal(false);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentPhoto('');
      await loadStudents(); // Reload students list
    } else {
      alert('Erro ao adicionar aluno. Tente novamente.');
    }
    
    setAddingStudent(false);
  };

  const getFileIcon = (fileType: MediaSubmission['fileType']) => {
    switch (fileType) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = [
    { title: 'Total de Alunos', value: students.length.toString(), icon: Award, color: 'primary' },
    { title: 'Com Uploads', value: '0', icon: TrendingUp, color: 'green' },
    { title: 'Este Mês', value: '0', icon: UserPlus, color: 'blue' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-2">Gerencie e acompanhe seus estudantes.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-md font-medium flex items-center gap-2 shadow-sm hover:-translate-y-0.5 transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Aluno
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-card border-border rounded-xl p-6 shadow-card-custom hover:-translate-y-0.5 transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex-1 max-w-md w-full">
          <AnimatedInput
            type="search"
            placeholder="Buscar alunos..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon="search"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-card border-border rounded-xl shadow-card-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Aluno</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Cadastro</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    Carregando alunos...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    onClick={() => handleStudentClick(student)}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer ${
                      index === filteredStudents.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {student.photoURL ? (
                          <img src={student.photoURL} alt={student.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {student.createdAt ? student.createdAt.toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudentClick(student);
                        }}
                        className="text-primary hover:text-primary/80 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm font-medium"
                      >
                        Ver Arquivos
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Media Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedStudent.photoURL ? (
                  <img src={selectedStudent.photoURL} alt={selectedStudent.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedStudent.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingMedia ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Carregando arquivos...</p>
                </div>
              ) : Object.keys(studentMedia).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <File className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Nenhum arquivo enviado ainda</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(studentMedia)
                    .sort(([dateA], [dateB]) => new Date(dateB.split('/').reverse().join('-')).getTime() - new Date(dateA.split('/').reverse().join('-')).getTime())
                    .map(([date, courseFiles]) => (
                      <div key={date} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleDate(date)}
                          className="w-full p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors flex items-center justify-between"
                        >
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            {date}
                          </h3>
                          {expandedDates[date] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        
                        {expandedDates[date] && (
                          <div className="p-4 space-y-4">
                            {Object.entries(courseFiles).map(([courseId, files]) => (
                              <div key={courseId} className="space-y-3">
                                <h4 className="text-sm font-semibold text-primary">
                                  {courses[courseId] || 'Aula Desconhecida'}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {files.map((media) => (
                                    <div
                                      key={media.id}
                                      className="border border-border bg-secondary/20 rounded-lg p-3 hover:bg-secondary/40 transition-colors"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                          {getFileIcon(media.fileType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-foreground truncate text-sm">{media.fileName}</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {formatFileSize(media.fileSize)} • {new Date(media.uploadedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                          {media.description && (
                                            <p className="text-xs text-muted-foreground mt-2">{media.description}</p>
                                          )}
                                        </div>
                                        <a
                                          href={media.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:text-primary/80 p-2 shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Download className="w-4 h-4" />
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Adicionar Aluno</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewStudentName('');
                  setNewStudentEmail('');
                  setNewStudentPhoto('');
                }}
                className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  required
                  className="w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="Ex: maria@email.com"
                  required
                  className="w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  URL da Foto (opcional)
                </label>
                <input
                  type="url"
                  value={newStudentPhoto}
                  onChange={(e) => setNewStudentPhoto(e.target.value)}
                  placeholder="Ex: https://exemplo.com/foto.jpg"
                  className="w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewStudentName('');
                    setNewStudentEmail('');
                    setNewStudentPhoto('');
                  }}
                  className="flex-1 bg-secondary/50 hover:bg-secondary/70 text-foreground px-4 py-3 rounded-lg font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  {addingStudent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
