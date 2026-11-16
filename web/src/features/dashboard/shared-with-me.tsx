"use client";

import { Users } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { QueryError } from "@/components/ui/query-error";
import type { DesignListItem, DesignListResponse } from "@/types";
import { DesignCard } from "./design-card";

type SharedWithMeProps = {
  query: UseQueryResult<DesignListResponse>;
  onOpen: (design: DesignListItem) => void;
};

export const SharedWithMe = ({ query, onOpen }: SharedWithMeProps) => {
  if (!query.isError && (query.data === undefined || query.data.designs.length === 0)) return null;

  return (
    <div className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-xl text-foreground">
        <Users className="size-5 text-primary" />
        Shared with me
      </h2>
      {query.isError ? (
        <QueryError
          error={query.error}
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {query.data?.designs.map((design) => (
            <DesignCard key={design.id} design={design} variant="shared" onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
};
