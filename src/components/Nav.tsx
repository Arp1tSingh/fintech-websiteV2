import { useEffect, useState } from "react";
import { NAV_ITEMS, sectionAt } from "../lib/scroll";
import { scrollToSection } from "../lib/lenis";
import { scroll } from "../three/progress";
import { SITE } from "../content/site";

/**
 * Anchor nav. Jumps go through lenis.scrollTo(target, { offset: -80 }) rather
 * than hash navigation, so a jump lands with the correct drawer framed instead
 * of snapping the document (DESIGN_BRIEF.md section 5).
 */
export function Nav() {
  const [active, setActive] = useState(NAV_ITEMS[0].id);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      // Arithmetic only — no layout reads, so this cannot thrash the frame.
      const id = sectionAt(scroll.progress).id;
      setActive((prev) => (prev === id ? prev : id));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <nav className="nav" aria-label="Sections">
      <a
        className="nav__mark label"
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          scrollToSection("hero");
        }}
      >
        {SITE.wordmark}
      </a>
      <ul className="nav__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <a
              className="nav__link label"
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(item.id);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}