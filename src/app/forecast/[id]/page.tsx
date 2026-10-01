import ForecastApp from "@/components/ForecastApp";
import { demoEvents } from "@/lib/fixtures";

export function generateStaticParams() {
  return demoEvents.flatMap((event) =>
    event.outcomes.map((outcome) => ({ id: `${event.id}::${outcome}` })),
  );
}

export default function Page() { return <ForecastApp />; }
