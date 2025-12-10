import { AppUpdateManager } from '../components/AppUpdateManager';


export const Updates = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Atualizações do App</h1>
      <AppUpdateManager />
    </div>
  );
};
