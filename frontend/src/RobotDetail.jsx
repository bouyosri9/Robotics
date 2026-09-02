import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import RobotSimulator from "./RobotSimulator";

export default function RobotDetail() {
  const { id } = useParams();
  const [robot, setRobot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupération dynamique des données du robot sélectionné
    fetch(`http://localhost:8000/api/robots/${id}/`)
      .then((res) => res.json())
      .then((data) => {
        setRobot(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération du robot :", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ color: "#fff", padding: "20px" }}>Chargement...</div>;
  if (!robot) return <div style={{ color: "#fff", padding: "20px" }}>Robot introuvable.</div>;

  return (
    <div style={{ padding: "20px", background: "#0b0e14", minHeight: "100vh" }}>
      <Link to="/" style={{ color: "#38bdf8", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>
        ← Retour au catalogue
      </Link>
      
      {/* Passage de l'objet robot récupéré dynamiquement */}
      <RobotSimulator robot={robot} />
    </div>
  );
}
