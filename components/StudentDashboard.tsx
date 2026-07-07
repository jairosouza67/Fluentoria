import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Award, ArrowUpRight, Sparkles, Trophy, Zap, PlayCircle, GraduationCap } from 'lucide-react';
import { Screen } from '../types';
import { auth } from '../lib/firebase';
import { getStudentProgress, createStudentProgress } from '../lib/gamification';
import LevelProgress from './LevelProgress';
import AttendanceTracker from './AttendanceTracker';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PageHeader } from './ui/PageHeader';
import { getCoursesForUser, getAllLessonProgress, countLessons, Course, CourseLessonProgress } from '../lib/db';
import { useCourseStore } from '../lib/stores/courseStore';

interface StudentDashboardProps {
  onNavigate: (screen: Screen) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [courseRows, setCourseRows] = useState<{ course: Course; completed: number; total: number; percentage: number; lastLessonId?: string; updatedAt?: Date }[]>([]);
  const [totalLessonsCompleted, setTotalLessonsCompleted] = useState(0);
  const user = auth.currentUser;
  const setSelectedCourse = useCourseStore(state => state.setSelectedCourse);

  useEffect(() => {
    loadProgress();
    loadCourses();
    const interval = setInterval(() => {
      loadProgress();
      loadCourses();
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;
    let progress = await getStudentProgress(user.uid);
    if (!progress) {
      await createStudentProgress(user.uid, user.displayName || user.email || 'Student', user.email || '');
      progress = await getStudentProgress(user.uid);
    }
    setStudentProgress(progress);
  };

  const loadCourses = async () => {
    if (!user) return;
    const [courses, allProgress] = await Promise.all([
      getCoursesForUser(user.uid),
      getAllLessonProgress(user.uid),
    ]);
    const progressMap: Record<string, CourseLessonProgress> = {};
    allProgress.forEach(p => { if (p.courseId) progressMap[p.courseId] = p; });

    const rows = courses.map(course => {
      const total = countLessons(course);
      const p = course.id ? progressMap[course.id] : undefined;
      const completed = p?.completedLessonIds?.length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const updatedAt = p?.updatedAt instanceof Date ? p.updatedAt : undefined;
      return { course, completed, total, percentage, lastLessonId: p?.lastLessonId, updatedAt };
    });

    setCourseRows(rows);
    setTotalLessonsCompleted(rows.reduce((acc, r) => acc + r.completed, 0));
  };

  const continueWatching = courseRows
    .filter(r => r.percentage > 0 && r.percentage < 100)
    .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));

  const handleContinue = (course: Course) => {
    setSelectedCourse(course);
    onNavigate('course-detail');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Bem-vindo de volta! Continue sua jornada de aprendizado."
        icon={<Sparkles size={24} />}
        sticky
      />

      {/* Continue assistindo */}
      {continueWatching.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Continue assistindo</h2>
            <button
              onClick={() => onNavigate('courses')}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Ver todas
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {continueWatching.map((row, index) => {
              const course = row.course;
              const displayImage = course.coverImage || (course.videoUrl ? course.videoUrl : null);
              return (
                <div
                  key={course.id}
                  className={`group shrink-0 ${index === 0 ? 'w-[280px] sm:w-[320px]' : 'w-[220px]'} cursor-pointer`}
                  onClick={() => handleContinue(course)}
                >
                  <Card className="h-full overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all duration-300">
                    <div className={`relative ${displayImage ? 'bg-black' : 'bg-gradient-to-br from-primary/20 to-[#E15B00]/20 min-h-[140px]'}`}>
                      {displayImage ? (
                        <>
                          <img src={displayImage} alt={course.title} className="w-full h-[140px] sm:h-[160px] object-cover block transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                            <PlayCircle size={28} />
                          </div>
                        </div>
                      )}
                      {index === 0 && (
                        <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                          Retomar
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${row.percentage}%` }} />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {row.completed} de {row.total} aulas • {row.percentage}%
                      </p>
                      <Button variant="primary" size="sm" className="w-full">Continuar aula</Button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center bg-card/30 border-dashed border-primary/20">
          <GraduationCap size={36} className="text-primary mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-1">Comece sua primeira aula</h3>
          <p className="text-sm text-muted-foreground mb-4">Você ainda não iniciou nenhum curso.</p>
          <Button variant="primary" onClick={() => onNavigate('courses')}>Explorar cursos</Button>
        </Card>
      )}

      {/* Level Progress */}
      {studentProgress && (
        <Card className="p-6">
          <LevelProgress
            currentXP={studentProgress.currentXP}
            currentLevel={studentProgress.currentLevel}
            showDetails={true}
            size="lg"
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onNavigate('achievements' as Screen)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span>{studentProgress.unlockedAchievements.length} Conquistas • Ver Ranking</span>
            </button>
          </div>
        </Card>
      )}

      {/* Stats Grid - 4 colunas em md */}
      {studentProgress && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 hover-elevate">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Total XP</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{studentProgress.totalXP}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              Nível {studentProgress.currentLevel} <ArrowUpRight className="w-3 h-3" />
            </p>
          </Card>

          <Card className="p-6 hover-elevate">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Conquistas</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{studentProgress.unlockedAchievements.length}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              Desbloqueadas <ArrowUpRight className="w-3 h-3" />
            </p>
          </Card>

          <Card className="p-6 hover-elevate">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Ranking</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">#{studentProgress.rank || '-'}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              Posição global <ArrowUpRight className="w-3 h-3" />
            </p>
          </Card>

          <Card className="p-6 hover-elevate">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Aulas concluídas</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{totalLessonsCompleted}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              Total geral <ArrowUpRight className="w-3 h-3" />
            </p>
          </Card>
        </div>
      )}

      {/* Attendance Tracker */}
      {user && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequência e Atividades</h2>
          <AttendanceTracker
            studentId={user.uid}
            studentName={user.displayName || user.email || 'Estudante'}
          />
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
