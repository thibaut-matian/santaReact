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

    // Charger les infos du groupe et les participants
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Charger le groupe
                const groupRes = await api.get(`/groups/${groupId}`);
                setGroup(groupRes.data);

                // 2. Charger SEULEMENT les participants de CE groupe
                const partsRes = await api.get(`/participants?groupId=${groupId}`);
                let participantsData = partsRes.data;

                // SÉCURITÉ : Filtrer côté client aussi pour éviter les participants orphelins
                participantsData = participantsData.filter(p => 
                    p.groupId && 
                    p.groupId.toString() === groupId.toString() &&
                    p.userId // Vérifier que userId existe aussi
                );

                console.log('Participants filtrés pour le groupe', groupId, ':', participantsData);

                // 3. Récupérer les infos des utilisateurs
                const participantsWithUsers = await Promise.all(
                    participantsData.map(async (participant) => {
                        try {
                            const userRes = await api.get(`/users/${participant.userId}`);
                            return {
                                ...participant,
                                user: userRes.data
                            };
                        } catch (error) {
                            console.error(`Erreur chargement user ${participant.userId}:`, error);
                            return {
                                ...participant,
                                user: { name: 'Utilisateur introuvable', email: 'N/A' }
                            };
                        }
                    })
                );

                setParticipants(participantsWithUsers);
                setLoading(false);
            } catch (error) {
                console.error("Erreur chargement groupe", error);
                setLoading(false);
            }
        };
        fetchData();
    }, [groupId]);

    // Fonction pour valider ou refuser un participant
    const handleStatusChange = async (participantId, newStatus) => {
        try {
            if (newStatus === 'rejected') {
                if (!window.confirm("Refuser ce participant ?")) return;
                // Si refusé, on le supprime de la liste (ou on change son statut en rejected)
                await api.delete(`/participants/${participantId}`);
                setParticipants(participants.filter(p => p.id !== participantId));
            } else {
                // Si validé, on met à jour le statut
                await api.patch(`/participants/${participantId}`, { status: newStatus });

                // On met à jour l'affichage localement
                setParticipants(participants.map(p =>
                    p.id === participantId ? { ...p, status: newStatus } : p
                ));
            }
        } catch (error) {
            alert("Erreur lors de la mise à jour");
        }
    };

    // Fonction pour lancer le tirage au sort
    const handleDraw = async () => {
        if (approved.length < 2) {
            alert("Il faut au moins 2 participants pour faire un tirage !");
            return;
        }

        if (!window.confirm(`Lancer le tirage au sort pour ${approved.length} participants ?`)) {
            return;
        }

        setDrawLoading(true);

        try {
            // 1. Créer une liste des IDs des participants
            const participantIds = approved.map(p => p.userId);
            
            // 2. Mélanger la liste (algorithme de Fisher-Yates)
            const shuffled = [...participantIds];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // 3. Assigner chaque participant à celui d'après (le dernier donne au premier)
            const assignments = [];
            for (let i = 0; i < participantIds.length; i++) {
                const giverId = participantIds[i];
                const receiverId = shuffled[(i + 1) % shuffled.length]; // Le % permet de revenir au début
                
                assignments.push({
                    giverId,
                    receiverId
                });
            }

            // 4. Mettre à jour chaque participant avec son destinataire
            await Promise.all(
                assignments.map(({ giverId, receiverId }) => {
                    const participant = approved.find(p => p.userId === giverId);
                    return api.patch(`/participants/${participant.id}`, {
                        gifteeId: receiverId
                    });
                })
            );

            // 5. Marquer le groupe comme "tirage effectué"
            await api.patch(`/groups/${groupId}`, {
                isDrawDone: true,
                status: 'drawn'
            });

            // 6. Recharger les données
            window.location.reload(); // Solution simple, ou refetch les données
            
            alert(`🎁 Tirage au sort terminé ! ${approved.length} participants ont reçu leur assignation.`);

        } catch (error) {
            console.error("Erreur lors du tirage:", error);
            alert("Erreur lors du tirage au sort. Réessayez.");
        } finally {
            setDrawLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-10 text-white">Chargement...</div>;

    // On sépare les listes pour l'affichage
    const pending = participants.filter(p => p.status === 'pending');
    const approved = participants.filter(p => p.status === 'approved');

    return (
        <div className="min-h-screen text-slate-200 pb-10">

            {/* NAVBAR SIMPLE */}
            <nav className="navbar bg-slate-900/80 backdrop-blur-md shadow-md fixed top-0 z-50 text-white">
                <div className="flex-1">
                    <span className="btn btn-ghost text-xl text-green-400">
                        🎄 {group?.name}
                    </span>
                </div>
                <div className="flex-none">
                    <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm">
                        Quitter
                    </button>
                </div>
            </nav>

            <main className="pt-24 px-4 max-w-5xl mx-auto space-y-8">

                {/* SECTION 1 : EN ATTENTE DE VALIDATION */}
                <section className="bg-orange-500/10 backdrop-blur-md rounded-2xl p-6 border border-orange-500/20 shadow-xl">
                    <h2 className="text-2xl font-bold text-orange-200 mb-4 flex items-center gap-2">
                        ⏳ Demandes en attente ({pending.length})
                    </h2>

                    {pending.length === 0 ? (
                        <p className="text-gray-400 italic">Aucune nouvelle demande.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {pending.map((p) => (
                                <div key={p.id} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center border border-slate-700">
                                    <div>
                                        <p className="font-bold text-white">
                                            {p.user ? p.user.name : `User ID: ${p.userId} (Non trouvé)`}
                                        </p>
                                        <p className="text-sm text-gray-400">{p.user?.email}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusChange(p.id, 'approved')}
                                            className="btn btn-success btn-sm text-white"
                                        >
                                            ✔
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(p.id, 'rejected')}
                                            className="btn btn-error btn-sm text-white"
                                        >
                                            ✖
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* SECTION 2 : PARTICIPANTS VALIDÉS */}
                <section className="bg-green-600/10 backdrop-blur-md rounded-2xl p-6 border border-green-500/20 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-green-200 flex items-center gap-2">
                            ✅ Participants validés ({approved.length})
                        </h2>
                        
                        {/* BOUTON DE TIRAGE AU SORT avec la fonction onClick */}
                        <button
                            onClick={handleDraw}
                            className="btn btn-primary bg-gradient-to-r from-red-500 to-red-700 border-none shadow-lg text-white"
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

                    {/* Affichage si le tirage est déjà fait */}
                    {group?.isDrawDone && (
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                            <p className="text-green-200 font-semibold">
                                🎉 Le tirage au sort a été effectué ! Les participants peuvent maintenant voir leur destinataire.
                            </p>
                        </div>
                    )}

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
                                        <td><span className="badge badge-success gap-2">Validé</span></td>
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
                </section>

            </main>
        </div>
    );
};

export default GroupManage;