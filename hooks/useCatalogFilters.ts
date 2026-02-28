import { useState, useEffect, useCallback, useMemo } from 'react';
import { Course } from '../lib/db';

interface UseCatalogFiltersProps {
  getCurrentList: () => Course[];
}

export const useCatalogFilters = ({ getCurrentList }: UseCatalogFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [durationFilterOpen, setDurationFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [durationFilter, setDurationFilter] = useState<string>('');

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setDateFilterOpen(false);
        setDurationFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCourses = useMemo(() => {
    return getCurrentList().filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());

      // Date filter
      let matchesDate = true;
      if (dateFilter) {
        const courseDate = course.launchDate ? new Date(course.launchDate) : null;
        const now = new Date();
        if (dateFilter === 'recent') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = courseDate ? courseDate >= thirtyDaysAgo : false;
        } else if (dateFilter === 'upcoming') {
          matchesDate = courseDate ? courseDate >= now : false;
        } else if (dateFilter === 'past') {
          matchesDate = courseDate ? courseDate < now : false;
        }
      }

      // Duration filter
      let matchesDuration = true;
      if (durationFilter && course.duration) {
        const durationParts = course.duration.split(':').map(Number);
        const minutes = durationParts.length === 2 ? durationParts[0] : 0;
        if (durationFilter === 'short') {
          matchesDuration = minutes < 10;
        } else if (durationFilter === 'medium') {
          matchesDuration = minutes >= 10 && minutes <= 30;
        } else if (durationFilter === 'long') {
          matchesDuration = minutes > 30;
        }
      }

      return matchesSearch && matchesDate && matchesDuration;
    });
  }, [getCurrentList, searchTerm, dateFilter, durationFilter]);

  const clearFilters = useCallback(() => {
    setDateFilter('');
    setDurationFilter('');
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    dateFilterOpen,
    setDateFilterOpen,
    durationFilterOpen,
    setDurationFilterOpen,
    dateFilter,
    setDateFilter,
    durationFilter,
    setDurationFilter,
    filteredCourses,
    clearFilters,
  };
};
