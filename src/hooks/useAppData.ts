import { useState, useEffect } from 'react';
import { Question, ExamHistory, ActiveExam } from '../types';
import { authFetch, handleResponse } from '../api';

export function useAppData(isLoggedIn: boolean) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([]);
  const [activeExams, setActiveExams] = useState<ActiveExam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAppData = () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    Promise.all([
      authFetch('/api/questions')
        .then(handleResponse)
        .then(data => setQuestions(data))
        .catch(err => console.error('Error fetching questions:', err)),
      authFetch('/api/exams')
        .then(handleResponse)
        .then(data => setActiveExams(data))
        .catch(err => console.error('Error fetching exams:', err)),
      authFetch('/api/history')
        .then(handleResponse)
        .then(data => setExamHistory(data))
        .catch(err => console.error('Error fetching history:', err)),
    ]).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchAppData();
  }, [isLoggedIn]);

  return {
    questions, setQuestions,
    examHistory, setExamHistory,
    activeExams, setActiveExams,
    isLoading,
    refreshAppData: fetchAppData
  };
}
