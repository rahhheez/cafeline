import { useEffect, useState } from "react";
import { cafeSlides } from "./authSlides";

export default function AuthCarousel({ slides = cafeSlides }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="auth-visual auth-carousel" aria-label="Cafe showcase">
      {slides.map((slide, index) => (
        <div
          className={index === activeIndex ? "auth-slide active" : "auth-slide"}
          key={slide.title}
          style={{ backgroundImage: `url(${slide.image})` }}
        />
      ))}

      <div className="auth-visual-copy">
        <span className="reserve-seal">CR</span>
        <p className="eyebrow">{activeSlide.eyebrow}</p>
        <h1>{activeSlide.title}</h1>
        <p>{activeSlide.text}</p>
        <div className="auth-specials">
          {activeSlide.tags.map(tag => <span key={tag}>{tag}</span>)}
        </div>
        <div className="auth-dots" aria-label="Carousel controls">
          {slides.map((slide, index) => (
            <button
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              className={index === activeIndex ? "active" : ""}
              key={slide.title}
              type="button"
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
