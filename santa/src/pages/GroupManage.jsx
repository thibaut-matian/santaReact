import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const GroupManage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawLoading, setDrawLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            console.log('🔍 Chargement du groupe:', groupId);
            
            try {
                // 1. Charger le groupe
                const groupRes = await api.get(`/groups/${groupId}`);
                setGroup(groupRes.data);
                console.log('✅ Groupe chargé:', groupRes.data);

                // 2. Charger les participants de ce groupe
                const partsRes = await api.get(`/participants?groupId=${groupId}`);
                let participantsData = partsRes.data;
                
                console.log('📊 Participants bruts:', participantsData);

                // 3. Filtrer les participants valides
                participantsData = participantsData.filter(p => {
                    const isValid = p.userId && p.userId !== null && p.userId !== 'null';
                    if (!isValid) {
                        console.warn('❌ Participant invalide ignoré:', p);
                    }
                    return isValid;
                });

                console.log('✅ Participants valides:', participantsData);

                // 4. Récupérer les infos des utilisateurs
                const participantsWithUsers = await Promise.all(
                    participantsData.map(async (participant) => {
                        try {
                            const userRes = await api.get(`/users/${participant.userId}`);
                            console.log(`✅ User ${participant.userId}:`, userRes.data);
                            return {
                                ...participant,
                                user: userRes.data
                            };
                        } catch (error) {
                            console.error(`❌ Erreur user ${participant.userId}:`, error);
                            return {
                                ...participant,
                                user: { name: 'Utilisateur introuvable', email: 'N/A' }
                            };
                        }
                    })
                );

                console.log('🎯 Participants finaux:', participantsWithUsers);
                setParticipants(participantsWithUsers);
                setLoading(false);
            } catch (error) {
                console.error("❌ Erreur chargement groupe:", error);
                setLoading(false);
            }
        };
        
        fetchData();
    }, [groupId]);

    const handleStatusChange = async (participantId, newStatus) => {
        console.log('🔍 Changement de statut:', participantId, '->', newStatus);
        
        try {
            if (newStatus === 'rejected') {
                if (!window.confirm("Refuser ce participant ?")) return;
                
                await api.delete(`/participants/${participantId}`);
                setParticipants(participants.filter(p => p.id !== participantId));
                
            } else if (newStatus === 'approved') {
                console.log('✅ Validation participation:', participantId);
                
                
                const currentParticipant = participants.find(p => p.id === participantId);
                
                const response = await api.put(`/participants/${participantId}`, {
                    ...currentParticipant,
                    status: newStatus
                });
                
                console.log('📡 Réponse serveur:', response.data);
                
                // Mise à jour locale
                setParticipants(participants.map(p =>
                    p.id === participantId ? { ...p, status: newStatus } : p
                ));
                
                console.log('🎉 Participant validé avec succès !');
            }
        } catch (error) {
            console.error('❌ ERREUR lors du changement de statut:', error);
            alert(`Erreur: ${error.message}`);
        }
    };

    // Fonction pour lancer le tirage au sort
    const handleDraw = async () => {
        // 1. Récupérer TOUS les participants validés (excluding pending)
        const approved = participants.filter(p => p.status === 'approved');
        
        console.log('👥 Participants validés:', approved.length);
        
        if (approved.length < 2) {
            alert("Il faut au moins 2 participants validés pour faire un tirage !");
            return;
        }

        if (!window.confirm(`Lancer le tirage au sort pour ${approved.length} participants ?`)) {
            return;
        }

        setDrawLoading(true);

        try {
            // 2. Remettre TOUS les gifteeId à null avant nouveau tirage
            console.log('🔄 Remise à zéro des assignations...');
            await Promise.all(
                approved.map(participant => 
                    api.put(`/participants/${participant.id}`, {
                        ...participant,
                        gifteeId: null
                    })
                )
            );

            // 3. Créer la liste des IDs utilisateur
            const userIds = approved.map(p => p.userId);
            console.log('📋 Liste des participants:', userIds);
            
            // 4. Mélanger la liste (Fisher-Yates)
            const shuffled = [...userIds];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            console.log('🎲 Liste mélangée:', shuffled);

            // 5. ALGORITHME SIMPLIFIÉ ET SÛR
            let attempts = 0;
            let assignments = [];

            do {
                attempts++;
                assignments = [];
                
                // Re-mélanger à chaque tentative
                const shuffled = [...userIds];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                
                // Créer les assignations
                let isValid = true;
                for (let i = 0; i < userIds.length; i++) {
                    const giverId = userIds[i];
                    const receiverId = shuffled[i];
                    
                    if (giverId === receiverId) {
                        console.log(`🔄 Tentative ${attempts}: Collision détectée, nouveau mélange...`);
                        isValid = false;
                        break;
                    }
                    
                    assignments.push({ giverId, receiverId });
                }
                
                if (isValid) {
                    console.log(`✅ Tirage valide trouvé en ${attempts} tentative(s)!`);
                    break;
                }
                
            } while (attempts < 50); // Max 50 tentatives

            if (attempts >= 50) {
                alert('Impossible de générer un tirage valide. Contactez le développeur.');
                setDrawLoading(false);
                return;
            }

            console.log('🎯 Assignations finales:', assignments);

            // 6. Enregistrer les assignations dans la BD
            await Promise.all(
                assignments.map(({ giverId, receiverId }) => 
                    api.put(`/participants/${giverId}`, {
                        status: 'approved',
                        gifteeId: receiverId
                    })
                )
            );

            console.log('✅ Tirage au sort enregistré avec succès !');
            alert('Tirage au sort effectué avec succès !');
            
            // Recharger les données du groupe pour refléter les changements
            const updatedGroupRes = await api.get(`/groups/${groupId}`);
            setGroup(updatedGroupRes.data);

            const updatedParticipantsRes = await api.get(`/participants?groupId=${groupId}`);
            setParticipants(updatedParticipantsRes.data);

        } catch (error) {
            console.error('❌ ERREUR lors du tirage au sort:', error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setDrawLoading(false);
        }
    };

    if (loading) {
        return <div>Chargement en cours...</div>;
    }

    return (
        <div>
            <h1>Gestion du groupe: {group.name}</h1>
            
            <h2>Participants ({participants.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {participants.map(participant => (
                        <tr key={participant.id}>
                            <td>{participant.user.name}</td>
                            <td>{participant.user.email}</td>
                            <td>{participant.status}</td>
                            <td>
                                {participant.status === 'pending' ? (
                                    <button onClick={() => handleStatusChange(participant.id, 'approved')}>Approuver</button>
                                ) : (
                                    <button onClick={() => handleStatusChange(participant.id, 'rejected')}>Refuser</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <button onClick={handleDraw} disabled={drawLoading}>
                {drawLoading ? 'Tirage en cours...' : 'Lancer le tirage au sort'}
            </button>
        </div>
    );
};

export default GroupManage;
