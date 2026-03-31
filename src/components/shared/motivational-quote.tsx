'use client';

import { useState } from 'react';

const QUOTES = [
  { text: "La repetición es la madre de la retención.", author: "Proverbio académico" },
  { text: "El conocimiento es poder, pero la práctica es la llave.", author: "Thomas Fuller" },
  { text: "No hay atajos al conocimiento verdadero.", author: "Royal Society" },
  { text: "Estudiar no es llenar un recipiente, es encender una llama.", author: "W.B. Yeats" },
  { text: "La constancia supera al talento cuando el talento no es constante.", author: "Anónimo" },
  { text: "Cada sesión de repaso fortalece los cimientos de tu conocimiento.", author: "The Curator" },
  { text: "El mejor momento para repasar fue ayer. El segundo mejor es ahora.", author: "Proverbio chino adaptado" },
  { text: "La disciplina es la clave que abre las puertas del éxito académico.", author: "Anónimo" },
];

function getDayOfYear() {
  return Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
}

export function MotivationalQuote() {
  const [quoteIndex] = useState(() => getDayOfYear() % QUOTES.length);
  const quote = QUOTES[quoteIndex];

  return (
    <div className="mt-12 pt-8 border-t border-outline-variant/10">
      <blockquote className="text-center">
        <p className="font-headline italic text-lg text-on-surface-variant/70">
          &ldquo;{quote.text}&rdquo;
        </p>
        <footer className="mt-2 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40">
          — {quote.author}
        </footer>
      </blockquote>
    </div>
  );
}
