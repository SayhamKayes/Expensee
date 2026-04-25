export function Footer() {
    const currentYear = new Date().getFullYear(); // This will automatically update the year
  
    return (
      <footer className="w-full py-0 mt-auto">
        <div className="text-center text-sm text-muted-foreground opacity-80">
          Copyright &copy; {currentYear} | Developed by <a href="https://sayhamkayes.github.io/portfolio/" target="_blank"><b>Sayham Kayes</b></a>
        </div>
      </footer>
    );
  }