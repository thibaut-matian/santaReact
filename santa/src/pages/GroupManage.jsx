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
        const approved = participants.filter(p => p.status === 'approved');
        
        if (approved.length < 2) {
            alert("Il faut au moins 2 participants validés pour faire un tirage !");
            return;
        }

        if (!window.confirm(`Lancer le tirage au sort pour ${approved.length} participants ?`)) {
            return;
        }

        setDrawLoading(true);

        try {
            console.log('🎲 === DÉBUT DU TIRAGE AU SORT ===');
            console.log('👥 Participants approuvés:', approved.length);
            
            // 1. Lister tous les participants
            approved.forEach((p, i) => {
                console.log(`${i + 1}. ${p.user?.name} (userId: ${p.userId}, participantId: ${p.id})`);
            });

            // 2. Remettre à zéro TOUTES les assignations
            console.log('🔄 Remise à zéro des assignations...');
            
            for (let i = 0; i < approved.length; i++) {
                const participant = approved[i];
                console.log(`🔄 Reset ${i + 1}/${approved.length}: ${participant.user?.name}`);
                
                try {
                    await api.put(`/participants/${participant.id}`, {
                        ...participant,
                        gifteeId: null
                    });
                    console.log(`✅ Reset OK pour ${participant.user?.name}`);
                } catch (error) {
                    console.error(`❌ Erreur reset ${participant.user?.name}:`, error);
                }
            }

            // 3. Créer la liste des userIds
            const userIds = approved.map(p => p.userId);
            console.log('📋 UserIds:', userIds);
            
            // 4. Mélanger la liste
            const shuffled = [...userIds];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            console.log('🎲 UserIds mélangés:', shuffled);

            // 5. Créer TOUTES les assignations (algorithme circulaire)
            const assignments = [];
            for (let i = 0; i < shuffled.length; i++) {
                const giverId = shuffled[i];
                const receiverId = shuffled[(i + 1) % shuffled.length];
                
                assignments.push({ giverId, receiverId });
                console.log(`🎁 Assignation ${i + 1}/${shuffled.length}: ${giverId} → ${receiverId}`);
            }
            
            console.log('🎯 TOUTES les assignations créées:', assignments.length);
            
            // 6. VÉRIFICATION obligatoire
            if (assignments.length !== approved.length) {
                console.error('❌ ERREUR: Nombre d\'assignations incorrect !');
                console.log(`Expected: ${approved.length}, Got: ${assignments.length}`);
                alert('Erreur dans le nombre d\'assignations');
                setDrawLoading(false);
                return;
            }

            // 7. Sauvegarder UNE PAR UNE avec vérification
            console.log('💾 === SAUVEGARDE DES ASSIGNATIONS ===');
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < assignments.length; i++) {
                const { giverId, receiverId } = assignments[i];
                const participant = approved.find(p => p.userId === giverId);
                
                if (!participant) {
                    console.error(`❌ Participant non trouvé pour userId: ${giverId}`);
                    errorCount++;
                    continue;
                }
                
                console.log(`💾 Sauvegarde ${i + 1}/${assignments.length}: ${participant.user?.name} (${giverId}) → ${receiverId}`);
                
                try {
                    const response = await api.put(`/participants/${participant.id}`, {
                        id: participant.id,
                        userId: participant.userId,
                        groupId: participant.groupId,
                        status: participant.status,
                        gifteeId: receiverId  // ← L'assignation
                    });
                    
                    console.log(`✅ Sauvegarde OK pour ${participant.user?.name}:`, response.data);
                    successCount++;
                    
                    // Petite pause entre les requêtes
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.error(`❌ Erreur sauvegarde ${participant.user?.name}:`, error);
                    console.error('📊 Détails:', error.response?.data);
                    errorCount++;
                }
            }
            
            console.log(`📊 Résultat sauvegarde: ${successCount} réussies, ${errorCount} échouées`);
            
            if (errorCount > 0) {
                alert(`Attention: ${errorCount} assignations ont échoué sur ${assignments.length}`);
            }

            // 8. Marquer le groupe comme terminé
            console.log('🏁 Finalisation du tirage...');
            await api.put(`/groups/${groupId}`, {
                ...group,
                isDrawDone: true,
                status: 'drawn'
            });

            console.log('🎉 === TIRAGE TERMINÉ ===');
            console.log(`✅ ${successCount}/${approved.length} participants assignés`);
            
            alert(`Tirage terminé ! ${successCount} assignations sur ${approved.length} participants.`);
            
            // Recharger la page pour voir les résultats
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('❌ Erreur générale tirage:', error);
            alert(`Erreur générale: ${error.message}`);
        } finally {
            setDrawLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-slate-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                    <p className="text-lg">Chargement...</p>
                </div>
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
                        <p className="text-slate-300">Participants: {participants.length} total</p>
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
