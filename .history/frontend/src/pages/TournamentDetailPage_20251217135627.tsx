import React from 'react';
import { useParams } from 'react-router-dom';
import { TournamentDetail } from '../components/tournaments/TournamentDetail';

export const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tournamentId = parseInt(id || '0');

  return <TournamentDetail tournamentId={tournamentId} />;
};

export default TournamentDetailPage;