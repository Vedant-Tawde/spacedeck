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
import { PieChart as PieChartIcon, Activity } from 'lucide-react';

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

const ChartsSection = ({ issHistory, newsByCategory = {} }) => {
  const newsData = Object.values(newsByCategory).flat();
  const lineData = {
    labels: issHistory.map(h => h.timestamp),
    datasets: [
      {
        label: 'ISS Speed (km/h)',
        data: issHistory.map(h => h.speed),
        borderColor: '#e76f51',
        backgroundColor: 'rgba(231, 111, 81, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#e76f51',
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { weight: 'bold', size: 12 },
          boxWidth: 20,
          usePointStyle: false,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { weight: 'bold' } }
      },
      x: {
        grid: { display: false },
        ticks: { 
          maxRotation: 45, 
          minRotation: 45,
          font: { size: 10, weight: 'bold' }
        }
      },
    },
  };

  const categoryCounts = Object.entries(newsByCategory).reduce((acc, [category, articles]) => {
    acc[category] = articles.length;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.values(categoryCounts),
        backgroundColor: [
          '#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51',
          '#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ffca3a'
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Speed Trend Chart */}
        <div className="bg-[#fff9f5] dark:bg-slate-900 p-8 rounded-[2.5rem] border border-[#f5e6da] dark:border-slate-800 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#e76f51]/10 text-[#e76f51] rounded-2xl flex items-center justify-center">
              <Activity size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">ISS Speed Trend</h3>
          </div>
          <div className="flex-1 min-h-0">
            {issHistory.length > 1 ? (
              <Line data={lineData} options={lineOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                <p className="text-sm font-bold uppercase tracking-widest italic">Gathering orbital telemetry...</p>
              </div>
            )}
          </div>
        </div>

        {/* News Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
              <PieChartIcon size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">News Category Distribution</h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {Object.keys(categoryCounts).length > 0 ? (
              <div className="w-full max-w-[350px]">
                <Pie data={pieData} options={{ maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } } } }} />
              </div>
            ) : (
              <p className="text-sm text-slate-400 font-bold uppercase italic">Syncing news data...</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] opacity-70 mb-2">Total Data Points</h4>
          <p className="text-4xl font-black">{issHistory.length + newsData.length}</p>
        </div>
        <div className="p-8 rounded-[2rem] bg-[#e76f51] text-white shadow-xl shadow-[#e76f51]/20">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] opacity-70 mb-2">Average Speed</h4>
          <p className="text-4xl font-black">
            {issHistory.length > 0 
              ? Math.round(issHistory.reduce((a, b) => a + b.speed, 0) / issHistory.length).toLocaleString() 
              : "0"} <span className="text-lg font-normal opacity-70">km/h</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
