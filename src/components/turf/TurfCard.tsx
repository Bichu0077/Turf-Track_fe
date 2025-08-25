import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Turf } from "@/types";
import { Link } from "react-router-dom";

interface Props { turf: Turf }

export default function TurfCard({ turf }: Props) {
  return (
    <Card className="card-elevated overflow-hidden group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={turf.images[0]}
          alt={`${turf.name} sports turf in ${turf.location.address}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{turf.name}</CardTitle>
        <div className="text-sm text-muted-foreground">{turf.location.address}</div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">{turf.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {turf.amenities.slice(0, 3).map((a) => (
            <span key={a} className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
              {a}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold">₹{turf.pricePerHour}</span>
          <span className="text-muted-foreground">/hr</span>
        </div>
        <Button asChild variant="secondary">
          <Link to={`/turfs/${turf.id}`}>View details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
