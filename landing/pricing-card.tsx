import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingCardProps {
  name: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
}

export function PricingCard({ name, price, description, features, highlighted }: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col border-border",
        highlighted && "border-primary shadow-lg shadow-primary/10"
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Most Popular
        </div>
      )}
      <CardHeader className="pb-2 pt-6">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        <div className="mb-6">
          <span className="text-4xl font-bold text-foreground">{price}</span>
          {price !== "$0" && <span className="text-muted-foreground">/month</span>}
        </div>
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-accent" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="w-full"
          variant={highlighted ? "default" : "outline"}
        >
          <Link href="/dashboard">Get Started</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
