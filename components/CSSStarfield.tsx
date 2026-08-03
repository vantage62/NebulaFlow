export default function CSSStarfield() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black pointer-events-none">
      {/* Fallback CSS starfield using radial gradients and keyframes */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 50px 160px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 90px 40px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 130px 80px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 160px 120px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 200px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 240px 100px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 280px 150px, #ffffff, rgba(0,0,0,0))
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '300px 300px',
        }}
      />
      <div 
        className="absolute inset-0 opacity-20 mix-blend-screen animate-pulse-slow"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 30px 80px, #a78bfa, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 110px 150px, #8b5cf6, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 180px 60px, #c4b5fd, rgba(0,0,0,0))
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
}
