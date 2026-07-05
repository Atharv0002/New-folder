import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPACESHIP_WIDTH = 50;
const SPACESHIP_HEIGHT = 65;
const SPACESHIP_BOTTOM_OFFSET = 140; 
const ASTEROID_SIZE = 45;
const GAME_SPEED = 6; 

const INITIAL_SHIP_X = (SCREEN_WIDTH - SPACESHIP_WIDTH) / 2;

export default function App() {
  const [positionX, setPositionX] = useState(INITIAL_SHIP_X);
  const [targetX, setTargetX] = useState(INITIAL_SHIP_X);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const asteroidY = useRef(-ASTEROID_SIZE);
  const asteroidX = useRef(Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE));
  const requestRef = useRef(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const savedScore = await AsyncStorage.getItem('@high_score');
      if (savedScore !== null) setHighScore(parseInt(savedScore, 10));
    } catch (e) { console.log(e); }
  };

  const saveHighScore = async (newHigh) => {
    try { await AsyncStorage.setItem('@high_score', newHigh.toString()); } catch (e) { console.log(e); }
  };

  // --- Smooth Horizontal Interpolation (Ease-Out) ---
  useEffect(() => {
    let animId;
    const smoothMove = () => {
      setPositionX((prev) => {
        const diff = targetX - prev;
        if (Math.abs(diff) < 0.5) return targetX;
        return prev + diff * 0.25; // 25% closer to target per frame
      });
      animId = requestAnimationFrame(smoothMove);
    };
    animId = requestAnimationFrame(smoothMove);
    return () => cancelAnimationFrame(animId);
  }, [targetX]);

  const moveLeft = () => {
    if (gameOver) return;
    setTargetX((prev) => Math.max(10, prev - 45));
  };

  const moveRight = () => {
    if (gameOver) return;
    setTargetX((prev) => Math.min(SCREEN_WIDTH - SPACESHIP_WIDTH - 10, prev + 45));
  };

  // --- Game Loop ---
  const gameLoop = () => {
    if (gameOver) return;

    asteroidY.current += GAME_SPEED;

    if (asteroidY.current > SCREEN_HEIGHT - 120) {
      asteroidY.current = -ASTEROID_SIZE;
      asteroidX.current = Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE);
      setScore((prev) => {
        const nextScore = prev + 1;
        if (nextScore > highScore) {
          setHighScore(nextScore);
          saveHighScore(nextScore);
        }
        return nextScore;
      });
    }

    // AABB Collision Detection
    const shipLeft = positionX;
    const shipRight = positionX + SPACESHIP_WIDTH;
    const shipTop = SCREEN_HEIGHT - SPACESHIP_BOTTOM_OFFSET - SPACESHIP_HEIGHT;
    const shipBottom = SCREEN_HEIGHT - SPACESHIP_BOTTOM_OFFSET;

    const astLeft = asteroidX.current;
    const astRight = asteroidX.current + ASTEROID_SIZE;
    const astTop = asteroidY.current;
    const astBottom = asteroidY.current + ASTEROID_SIZE;

    if (shipLeft < astRight && shipRight > astLeft && shipTop < astBottom && shipBottom > astTop) {
      setGameOver(true);
      return;
    }

    setTick((t) => t + 1);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (!gameOver) requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameOver, positionX, highScore]);

  const restartGame = () => {
    asteroidY.current = -ASTEROID_SIZE;
    asteroidX.current = Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE);
    setTargetX(INITIAL_SHIP_X);
    setPositionX(INITIAL_SHIP_X);
    setScore(0);
    setGameOver(false);
  };

  return (
    <LinearGradient colors={['#060814', '#0b112c', '#050716']} style={styles.container}>
      {/* Modern Glassmorphic HUD */}
      <View style={styles.hudContainer}>
        <View style={styles.hudBlock}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>
        <View style={styles.hudBlock}>
          <Text style={styles.hudLabelText}>🏆 BEST</Text>
          <Text style={[styles.hudValue, { color: '#00f0ff' }]}>{highScore}</Text>
        </View>
      </View>

      {/* Playfield */}
      <View style={styles.gameArea}>
        {/* Polished Asteroid */}
        <View style={[styles.asteroid, { top: asteroidY.current, left: asteroidX.current }]}>
          <View style={styles.crater1} />
          <View style={styles.crater2} />
        </View>
        
        {/* Neon Cyberpunk Spaceship */}
        <View style={[styles.spaceship, { left: positionX }]}>
          <View style={styles.cyberNose} />
          <View style={styles.cyberBody}>
            <View style={styles.cyberCore} />
          </View>
          <View style={styles.cyberWingLeft} />
          <View style={styles.cyberWingRight} />
          <View style={styles.neonEngineTrail} />
        </View>

        {gameOver && (
          <View style={styles.gameOverPanel}>
            <Text style={styles.gameOverTitle}>SYSTEM FAILURE</Text>
            <Text style={styles.gameOverSubtitle}>Data Recovered: {score} Nodes</Text>
            <TouchableOpacity style={styles.restartBtn} onPress={restartGame}>
              <Text style={styles.restartBtnText}>REBOOT SYSTEM</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls Area */}
      <View style={styles.controlsLayout}>
        <TouchableOpacity activeOpacity={0.7} style={styles.navButton} onPress={moveLeft}>
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.navButton} onPress={moveRight}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hudContainer: { marginTop: 60, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, zIndex: 5 },
  hudBlock: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  hudLabel: { color: '#ff0055', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  hudLabelText: { color: '#00f0ff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  hudValue: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  gameArea: { flex: 1, position: 'relative' },
  
  // Polished Cyber Asteroid
  asteroid: { position: 'absolute', width: ASTEROID_SIZE, height: ASTEROID_SIZE, backgroundColor: '#2d3244', borderRadius: 14, borderWidth: 2, borderColor: '#4e5670', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
  crater1: { position: 'absolute', top: 6, left: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#1f2230' },
  crater2: { position: 'absolute', bottom: 8, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: '#1f2230' },

  // Polished Cyberpunk Spaceship Design
  spaceship: { position: 'absolute', bottom: 50, width: SPACESHIP_WIDTH, height: SPACESHIP_HEIGHT, alignItems: 'center' },
  cyberNose: { width: 6, height: 16, backgroundColor: '#ff0055', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  cyberBody: { width: 18, height: 35, backgroundColor: '#ffffff', marginTop: -4, borderTopLeftRadius: 6, borderTopRightRadius: 6, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  cyberCore: { width: 6, height: 14, backgroundColor: '#00f0ff', borderRadius: 3 },
  cyberWingLeft: { position: 'absolute', bottom: 12, left: 2, width: 14, height: 24, backgroundColor: '#ff0055', borderTopLeftRadius: 12, borderBottomLeftRadius: 4, transform: [{ skewY: '-15deg' }] },
  cyberWingRight: { position: 'absolute', bottom: 12, right: 2, width: 14, height: 24, backgroundColor: '#ff0055', borderTopRightRadius: 12, borderBottomRightRadius: 4, transform: [{ skewY: '15deg' }] },
  neonEngineTrail: { width: 10, height: 12, backgroundColor: '#00f0ff', marginTop: -1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, shadowColor: '#00f0ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },

  // Modern UI Overlays & Buttons
  gameOverPanel: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 6, 18, 0.92)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  gameOverTitle: { color: '#ff0055', fontSize: 32, fontWeight: '900', letterSpacing: 2, textShadowColor: '#ff0055', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  gameOverSubtitle: { color: '#8c9fc2', fontSize: 16, marginTop: 10, marginBottom: 35 },
  restartBtn: { backgroundColor: 'transparent', paddingVertical: 14, paddingHorizontal: 35, borderRadius: 8, borderWidth: 2, borderColor: '#00f0ff', shadowColor: '#00f0ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  restartBtnText: { color: '#00f0ff', fontSize: 15, fontWeight: 'bold', letterSpacing: 2 },
  controlsLayout: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 50, paddingTop: 10 },
  navButton: { backgroundColor: 'rgba(255, 255, 255, 0.03)', width: 80, height: 65, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center' },
  navButtonText: { color: '#ffffff', fontSize: 24 }
});