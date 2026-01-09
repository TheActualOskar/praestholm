import { useEffect, useRef } from "react";

type Star = {
    x: number;
    y: number;
    r: number;   // radius
    a: number;   // alpha
    tw: number;  // twinkle strength
    vx: number;  // velocity x
    vy: number;  // velocity y
};

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const prefersReduced =
            window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

        let raf = 0;
        let stars: Star[] = [];

        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const rand = (min: number, max: number) => Math.random() * (max - min) + min;

        const resize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            canvas.width = Math.floor(w * DPR);
            canvas.height = Math.floor(h * DPR);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

            //Density --> lower more dense higher less dense
            const count = Math.floor((w * h) / 1400);

            // Drift direction.
            const baseAngle = Math.PI * 1.08; // down-left-ish

            stars = new Array(count).fill(0).map(() => {
                
                const farBias = Math.pow(Math.random(), 3.2); // lots of small ones

                // Tiny stars 
                const r = 0.18 + farBias * 1.1; 

                //  Speed: far stars move slower, near stars faster
                const speed = (0.35 + farBias * 1.25) * rand(0.8, 1.35);

                const angle = baseAngle + rand(-0.28, 0.28);

                return {
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r,
                    a: rand(0.08, 0.65) + farBias * 0.15,
                    tw: rand(0.006, 0.02),
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                };
            });
        };

        const wrap = (s: Star, w: number, h: number) => {
            const pad = 80;
            if (s.x < -pad) s.x = w + pad;
            if (s.x > w + pad) s.x = -pad;
            if (s.y < -pad) s.y = h + pad;
            if (s.y > h + pad) s.y = -pad;
        };

        const draw = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            ctx.clearRect(0, 0, w, h);

            for (const s of stars) {
                if (!prefersReduced) {
                    s.x += s.vx;
                    s.y += s.vy;

                    const wobble = (Math.random() - 0.5) * 0.01;
                    s.vx = Math.max(-1.4, Math.min(1.4, s.vx + wobble * 0.12));
                    s.vy = Math.max(-1.4, Math.min(1.4, s.vy + wobble * 0.12));

                    // twinkle
                    s.a += (Math.random() - 0.5) * s.tw;
                    s.a = Math.max(0.05, Math.min(0.95, s.a));
                }

                wrap(s, w, h);

                ctx.beginPath();
                ctx.fillStyle = `rgba(255,255,255,${s.a})`;
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();

                // subtle glow for the few larger/brighter stars
                if (s.r > 0.95 && s.a > 0.45) {
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(255,255,255,${s.a * 0.18})`;
                    ctx.arc(s.x, s.y, s.r * 3.0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            raf = window.requestAnimationFrame(draw);
        };

        resize();
        draw();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            window.cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div className="space-bg" aria-hidden="true">
            <canvas ref={canvasRef} className="space-bg__stars" />
            <div className="space-bg__glow glow1" />
            <div className="space-bg__glow glow2" />
            <div className="space-bg__glow glow3" />
            <div className="space-bg__grain" />
        </div>
    );
}
