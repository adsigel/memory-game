import MemoryGame from "../components/MemoryGame";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 items-center bg-white pt-2 pb-8">
      <MemoryGame />
    </main>
  );
}
