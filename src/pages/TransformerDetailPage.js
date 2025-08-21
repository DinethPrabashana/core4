import React from 'react';
import { useParams } from 'react-router-dom';
import TransformerDetail from '../components/TransformerDetail';

const TransformerDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="transformer-detail-page">
      <TransformerDetail transformerId={id} />
    </div>
  );
};

export default TransformerDetailPage;