// ==========================================
// Importing React, useState, useMemo, and Link from react-router-dom
import React, { useState, useMemo } from 'react';
// ==========================================
// Importing styles from './Join.module.scss'
import styles from './Join.module.scss';
// ==========================================
// Importing JoinBackGround from '../common/JoinBackGround'
import JoinBackGround from '../ThreeComponents/JoinBackGround';
// ==========================================
// Importing Link from 'react-router-dom'
import { Link } from 'react-router-dom';

const Join: React.FC = () => {

  // ==========================================
  // State using for name
  const [name, setName] = useState('');
  // ==========================================

  // ==========================================
  // State using for room
  const [room, setRoom] = useState('');
  // ==========================================
  // State using for isValid

  // ==========================================
  // State using for isValid
  const isValid = useMemo(() => Boolean(name.trim() && room.trim()), [name, room]);
  // ==========================================

  // ==========================================
  // Function using for handleJoinClick
  const handleJoinClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isValid) {
      event.preventDefault();
      return;
    }
    // Add pulse animation class temporarily
    const button = event.currentTarget;
    button.classList.add(styles.pulse);
    setTimeout(() => {
      button.classList.remove(styles.pulse);
      // Navigate to chat (in real app, use router)
      console.log(`Joining room "${room}" as "${name}"`);
    }, 300);
  };
  // ==========================================

  return (
    <div className={styles.page}>      
      {/* ========================================== */}
      {/* Join Three.js Background */}
      <JoinBackGround className={styles.threeBg} heroY={4.2} heroZ={-10} />
      {/* ========================================== */}

      {/* ========================================== */}
      {/* Join Card */}
      {/* ========================================== */}
      <div className={styles.gridGlow} />
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}><span role="img" aria-label="chat">💬</span></div>
          <div className={styles.logoText}>Chat Auth</div>
        </div>
        <h1 className={styles.heading}>Join the Chat</h1>
        <p className={styles.subheading}>Real Time Chat Application</p>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <label className={styles.label} htmlFor="name">Name</label>
            <input
              id="name"
              placeholder="e.g. Jhon Doe"
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label} htmlFor="room">Room</label>
            <input
              id="room"
              placeholder="e.g. room1"
              className={styles.input}
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
          <Link to={`/chat?name=${name}&room=${room}`}>
          <button className={styles.cta} onClick={handleJoinClick} disabled={!isValid}>
            Initialize Connection
            <span className={styles.ctaShine} />
          </button>
          </Link>
        </div>
        <div className={styles.footerNote}>Chat Auth</div>
      </div>
      {/* ========================================== */}
      {/* Join Card */}
      {/* ========================================== */}
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
    </div>
  );
};

export default Join;