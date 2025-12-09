import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
export default function BackgroundAnimation() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        let animationFrameId;
        let particles = [];
        let mouseX = -1000;
        let mouseY = -1000;
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        class Particle {
            x;
            y;
            size;
            speedX;
            speedY;
            baseAlpha;
            alpha;
            color;
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 4 + 1; // Larger particles (was 2 + 0.5)
                this.speedX = Math.random() * 0.8 - 0.4; // Slightly faster drift
                this.speedY = Math.random() * 0.8 - 0.4;
                this.baseAlpha = Math.random() * 0.7 + 0.3; // More visible (was 0.5 + 0.1)
                this.alpha = this.baseAlpha;
                // Mix of gold (accent) and white (primary) - more gold particles
                this.color = Math.random() > 0.6
                    ? '255, 215, 0' // Gold (40% now)
                    : '255, 255, 255'; // White (60%)
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                // Wrap around screen
                if (this.x > canvas.width)
                    this.x = 0;
                if (this.x < 0)
                    this.x = canvas.width;
                if (this.y > canvas.height)
                    this.y = 0;
                if (this.y < 0)
                    this.y = canvas.height;
                // Mouse interaction - stronger effect
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 200; // Larger interaction radius
                if (distance < maxDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (maxDistance - distance) / maxDistance;
                    // Stronger push away
                    this.x -= forceDirectionX * force * 3;
                    this.y -= forceDirectionY * force * 3;
                    // Stronger glow effect
                    this.alpha = Math.min(this.baseAlpha + force * 0.7, 1);
                    this.size = Math.min(8, this.size + force * 2);
                }
                else {
                    // Return to normal
                    if (this.alpha > this.baseAlpha) {
                        this.alpha -= 0.02;
                    }
                    if (this.size > 5) {
                        this.size -= 0.15;
                    }
                }
            }
            draw() {
                if (!ctx)
                    return;
                ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        const init = () => {
            particles = [];
            const numberOfParticles = (canvas.width * canvas.height) / 8000; // Higher density (was 15000)
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };
        const animate = () => {
            if (!ctx)
                return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        window.addEventListener('resize', () => {
            resizeCanvas();
            init();
        });
        window.addEventListener('mousemove', handleMouseMove);
        resizeCanvas();
        init();
        animate();
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);
    return (<div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/90"/>

      {/* Moving Orbs (Ethereal Layer) - More prominent */}
      <div className="absolute inset-0 opacity-60">
        <motion.div animate={{
            x: [0, 150, 0],
            y: [0, -80, 0],
            scale: [1, 1.3, 1],
        }} transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
        }} className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] bg-primary/20 rounded-full blur-[80px]"/>
        <motion.div animate={{
            x: [0, -150, 0],
            y: [0, 120, 0],
            scale: [1, 1.6, 1],
        }} transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
        }} className="absolute bottom-[-20%] right-[-15%] w-[70vw] h-[70vw] bg-accent/15 rounded-full blur-[100px]"/>
        {/* Additional center orb */}
        <motion.div animate={{
            x: [-50, 50, -50],
            y: [-30, 30, -30],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
        }} transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
        }} className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[60px]"/>
      </div>

      {/* Stardust Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"/>
    </div>);
}
