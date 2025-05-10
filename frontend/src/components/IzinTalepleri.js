import React, { useState, useEffect } from 'react';
import { izinService } from '../services/api';
import './IzinTalepleri.css';

const IzinTalepleri = () => {
  const [talepler, setTalepler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTalepler = async () => {
      try {
        console.log('İzin talepleri getiriliyor...'); // Debug log
        const data = await izinService.getIzinTalepleri();
        console.log('Gelen talepler:', data); // Debug log
        setTalepler(data);
        setLoading(false);
      } catch (err) {
        console.error('Hata detayı:', err); // Debug log
        setError('İzin talepleri yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchTalepler();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Onaylandı':
        return 'status-approved';
      case 'Reddedildi':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="izin-talepleri">
      <h2>İzin Taleplerim</h2>
      {talepler.length === 0 ? (
        <p>Henüz izin talebiniz bulunmamaktadır.</p>
      ) : (
        <div className="talepler-listesi">
          {talepler.map((talep) => (
            <div key={talep._id} className="talep-card">
              <div className="talep-header">
                <span className={`talep-status ${getStatusColor(talep.requestStatus)}`}>
                  {talep.requestStatus}
                </span>
                <span className="talep-date">
                  {new Date(talep.requestTime).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <div className="talep-content">
                <div className="talep-dates">
                  <strong>İzin Tarihleri:</strong> {talep.requestedDates}
                </div>
                <div className="talep-desc">
                  <strong>Açıklama:</strong> {talep.requestDesc}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IzinTalepleri; 