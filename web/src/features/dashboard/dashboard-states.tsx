"use client";

import { motion } from "framer-motion";
import { FileQuestion, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type EmptyDesignsProps = {
  onCreateClick: () => void;
};

type EmptyPanelProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

export const DesignCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-40 w-full rounded-none" />
    <CardContent className="space-y-3 p-4">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
  </Card>
);

const EmptyPanel = ({ icon, title, children }: EmptyPanelProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center px-4 py-24 text-center"
  >
    <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-secondary">
      {icon}
    </div>
    <h3 className="mb-2 font-heading text-2xl text-foreground">{title}</h3>
    {children}
  </motion.div>
);

export const EmptyDesigns = ({ onCreateClick }: EmptyDesignsProps) => (
  <EmptyPanel
    icon={<FileQuestion className="size-10 text-muted-foreground" />}
    title="No designs yet"
  >
    <p className="mb-8 max-w-md text-muted-foreground">
      Create your first floor plan to get started. Design rooms, place furniture, and bring your
      vision to life.
    </p>
    <Button onClick={onCreateClick}>
      <Plus />
      Create Your First Design
    </Button>
  </EmptyPanel>
);

export const EmptySearch = () => (
  <EmptyPanel
    icon={<Search className="size-10 text-muted-foreground" />}
    title="No matching designs"
  >
    <p className="max-w-md text-muted-foreground">
      Try adjusting your search term to find what you are looking for.
    </p>
  </EmptyPanel>
);
