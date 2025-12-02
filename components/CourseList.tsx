
import React, { useState, useEffect } from 'react';
import { Search, PlayCircle, FileText, Mic, Clock, Filter, Loader2 } from 'lucide-react';
import { Screen } from '../types';
import { Course, getCourses } from '../lib/db';

interface CourseListProps {
  onNavigate: (screen: Screen) => void;
  onSelectCourse: (course: Course) => void;
}

const CourseList: React.FC<CourseListProps> = ({ onNavigate, onSelectCourse }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Minhas Aulas</h1>
          <p className="text-stone-400 mt-1">Explore o catálogo e continue seu aprendizado.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={18} />
            <input
              type="text"
              placeholder="Buscar aulas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-[#292524] border border-stone-800 text-stone-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-stone-600"
            />
          </div>
          <button className="bg-[#292524] border border-stone-800 text-stone-300 p-2.5 rounded-lg hover:bg-[#35302e] hover:text-white transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => {
                onSelectCourse(course);
                onNavigate('course-detail');
              }}
              className="group bg-[#1c1917] border border-stone-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-900/10"
            >
              {/* Thumbnail */}
              <div className={`h-40 w-full bg-gradient-to-br ${course.thumbnail} relative flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white group-hover:scale-110 transition-transform border border-white/20">
                  {course.type === 'video' && <PlayCircle size={24} fill="white" className="text-white opacity-80" />}
                  {course.type === 'pdf' && <FileText size={24} />}
                  {course.type === 'audio' && <Mic size={24} />}
                </div>

                {/* Progress Bar overlay */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-stone-800/50">
                  <div className="h-full bg-orange-500" style={{ width: `${course.progress}%` }}></div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">{course.type}</span>
                  <div className="flex items-center gap-1 text-stone-500 text-xs">
                    <Clock size={12} />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">{course.title}</h3>
                <p className="text-sm text-stone-500 mb-4">{course.author}</p>

                <button className="w-full py-2 rounded-lg bg-[#292524] text-stone-300 text-sm font-medium group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  {course.progress === 0 ? 'Iniciar Aula' : course.progress === 100 ? 'Rever Aula' : 'Continuar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
