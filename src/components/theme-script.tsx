export function ThemeScript() {
  const js = `
    try {
      const t = localStorage.getItem("rd-theme");
      const dark = t ? t === "dark" : true;
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.classList.toggle("light", !dark);
    } catch {}
  `;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
