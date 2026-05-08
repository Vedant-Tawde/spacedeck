import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ChartsSection = ({ issHistory, newsData }) => {
  // Speed Chart Data
  const speedData = {
    labels: issHistory.map((_, i) => i + 1),
    datasets: [
      {
        label: 'ISS Speed (km/h)',
        data: issHistory.map(h => h.speed),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  // News Distribution Data
  const newsSourceCounts = useMemo(() => {
    const counts = {};
    newsData.forEach(article => {
      counts[article.source] = (counts[article.source] || 0) + 1;
    });
    return counts;
  }, [newsData]);

  const pieData = {
    labels: Object.keys(newsSourceCounts),
    datasets: [
      {
        label: '# of Articles',
        data: Object.values(newsSourceCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'currentColor'
        }
      },
    },
    scales: {
      y: {
        ticks: { color: 'currentColor' },
        grid: { color: 'rgba(150, 150, 150, 0.1)' }
      },
      x: {
        ticks: { color: 'currentColor' },
        grid: { color: 'rgba(150, 150, 150, 0.1)' }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-4">ISS Speed Trend</h3>
        <Line data={speedData} options={chartOptions} />
      </div>
      
      <div className="p-6 bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-4">News Source Distribution</h3>
        <div className="max-w-[400px] mx-auto">
          <Pie data={pieData} options={{...chartOptions, scales: {}}} />
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
