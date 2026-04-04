export interface Slide {
  title: string;
  subtitle: string;
  image: string;
  gradient: string;
}

export interface Feature {
  icon: React.ComponentType<unknown>;
  title: string;
  desc: string;
}

export interface Testimonial {
  name: string;
  company: string;
  rating: number;
  text: string;
  image: string;
}

export interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  highlighted?: boolean;
}

export interface StatsProps {
  target: number;
  label: string;
  suffix?: string;
}