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

            // 5. Créer les paires (chacun donne au suivant, le dernier au premier)
            const assignments = [];
            for (let i = 0; i < userIds.length; i++) {
                const giverId = userIds[i];
                const receiverId = shuffled[(i + 1) % shuffled.length];
                
                // SÉCURITÉ : Vérifier qu'on ne se donne pas à soi-même
                if (giverId === receiverId) {
                    console.error('❌ ERREUR: Une personne se donne à elle-même!');
                    alert('Erreur dans le tirage - relancez le tirage');
                    setDrawLoading(false);
                    return;
                }
                
                assignments.push({ giverId, receiverId });
            }
            
            console.log('🎯 Assignations finales:', assignments);

            // 6. Vérification : chaque personne doit apparaître exactement une fois comme donneur et receveur
            const givers = assignments.map(a => a.giverId).sort();
            const receivers = assignments.map(a => a.receiverId).sort();
            
            console.log('🎁 Donneurs:', givers);
            console.log('🎁 Receveurs:', receivers);
            
            if (givers.length !== receivers.length || givers.length !== userIds.length) {
                console.error('❌ ERREUR: Nombre incorrect d\'assignations');
                alert('Erreur dans le tirage - relancez le tirage');
                setDrawLoading(false);
                return;
            }

            // 7. Appliquer TOUTES les assignations
            console.log('💾 Application des assignations...');
            await Promise.all(
                assignments.map(async ({ giverId, receiverId }) => {
                    const participant = approved.find(p => p.userId === giverId);
                    console.log(`🎁 ${participant.user?.name} (${giverId}) → ${receiverId}`);
                    
                    return api.put(`/participants/${participant.id}`, {
                        ...participant,
                        gifteeId: receiverId
                    });
                })
            );

            // 8. Marquer le groupe comme terminé
            await api.put(`/groups/${groupId}`, {
                ...group,
                isDrawDone: true,
                status: 'drawn'
            });

            console.log('🎉 Tirage terminé avec succès !');
            alert(`Tirage réussi ! ${assignments.length} participants ont reçu leur assignation.`);
            window.location.reload();

        } catch (error) {
            console.error('❌ Erreur lors du tirage:', error);
            alert('Erreur lors du tirage au sort. Réessayez.');
        } finally {
            setDrawLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-slate-200 flex items-center justify-center">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    // Séparation des participants
    const pending = participants.filter(p => p.status === 'pending');
    const approved = participants.filter(p => p.status === 'approved');

    return (
        <div className="min-h-screen text-slate-200 pb-10 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900">
            
            <header className="bg-slate-800/40 backdrop-blur-md border-b border-slate-700/50 shadow-xl">
                <div className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">🎅 Gestion du groupe</h1>
                    <button 
                        onClick={() => navigate('/')} 
                        className="btn btn-ghost text-slate-300"
                    >
                        Se déconnecter
                    </button>
                </div>
            </header>

            <main className="pt-12 px-4 max-w-5xl mx-auto space-y-8">
                
                {group && (
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-4">{group.name}</h2>
                        <p className="text-slate-300">Modérateur: Vous</p>
                        <p className="text-slate-300">Statut: {group.isDrawDone ? '✅ Tirage effectué' : '⏳ En cours'}</p>
                    </div>
                )}

                {/* DEMANDES EN ATTENTE */}
                <section className="bg-orange-600/10 backdrop-blur-md rounded-2xl p-6 border border-orange-500/20 shadow-xl">
                    <h2 className="text-2xl font-bold text-orange-200 mb-4 flex items-center gap-2">
                        ⏳ Demandes en attente ({pending.length})
                    </h2>

                    {pending.length === 0 ? (
                        <p className="text-orange-100/70 italic">Aucune nouvelle demande.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table text-white w-full">
                                <thead>
                                    <tr className="text-slate-400 border-b border-white/10">
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.map((p) => (
                                        <tr key={p.id} className="border-b border-white/5">
                                            <td className="font-bold">{p.user?.name || 'Nom introuvable'}</td>
                                            <td>{p.user?.email || 'Email introuvable'}</td>
                                            <td className="space-x-2">
                                                <button
                                                    onClick={() => handleStatusChange(p.id, 'approved')}
                                                    className="btn btn-sm btn-success"
                                                >
                                                    ✅ Valider
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(p.id, 'rejected')}
                                                    className="btn btn-sm btn-error"
                                                >
                                                    ❌ Refuser
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* PARTICIPANTS VALIDÉS */}
                <section className="bg-green-600/10 backdrop-blur-md rounded-2xl p-6 border border-green-500/20 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-green-200 flex items-center gap-2">
                            ✅ Participants validés ({approved.length})
                        </h2>
                        
                        <button
                            onClick={handleDraw}
                            className="btn btn-primary bg-linear-to-r from-red-500 to-red-700 border-none shadow-lg text-white"
                            disabled={approved.length < 2 || drawLoading || group?.isDrawDone}
                        >
                            {drawLoading ? (
                                <>🔄 Tirage en cours...</>
                            ) : group?.isDrawDone ? (
                                <>✅ Tirage effectué</>
                            ) : (
                                <>🎁 Lancer le tirage au sort !</>
                            )}
                        </button>
                    </div>

                    {approved.length === 0 ? (
                        <p className="text-green-100/70 italic">Aucun participant validé.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table text-white w-full">
                                <thead>
                                    <tr className="text-slate-400 border-b border-white/10">
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Statut</th>
                                        {group?.isDrawDone && <th>Destinataire</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {approved.map((p) => (
                                        <tr key={p.id} className="border-b border-white/5">
                                            <td className="font-bold">{p.user?.name}</td>
                                            <td>{p.user?.email}</td>
                                            <td><span className="badge badge-success">Validé</span></td>
                                            {group?.isDrawDone && (
                                                <td>
                                                    {p.gifteeId ? (
                                                        <span className="text-green-400">🎁 Assigné</span>
                                                    ) : (
                                                        <span className="text-gray-400">En attente...</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
};

export default GroupManage;