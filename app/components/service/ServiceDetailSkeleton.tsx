export default function ServiceDetailSkeleton() {
  return (
    <div className="h-[93vh] flex flex-col px-6 overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between mb-6">
        <div className="animate-pulse">
          <div className="h-12 bg-white/10 rounded w-80 mb-2"></div>
          <div className="h-5 bg-white/10 rounded w-64"></div>
        </div>
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-10 bg-white/10 rounded-lg w-16"></div>
          <div className="h-10 bg-gradient-primary rounded-lg w-24"></div>
        </div>
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Left Column - Service Details Skeleton */}
          <div className="flex flex-col gap-6 overflow-y-auto pr-2">
            {/* Status Card Skeleton */}
            <div className="glass rounded-2xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="h-7 bg-white/10 rounded w-32"></div>
                <div className="h-10 bg-white/10 rounded-full w-24"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="h-4 bg-white/10 rounded w-32 mb-1"></div>
                  <div className="h-5 bg-white/10 rounded w-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 bg-white/10 rounded w-16 mb-1"></div>
                    <div className="h-5 bg-white/10 rounded w-12"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-white/10 rounded w-20 mb-1"></div>
                    <div className="h-5 bg-white/10 rounded w-8"></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
                <div className="h-16 bg-white/10 rounded"></div>
              </div>
            </div>

            {/* Danger Zone Skeleton */}
            <div className="glass rounded-2xl p-6 border border-red-500/20 animate-pulse">
              <div className="h-7 bg-red-500/20 rounded w-32 mb-4"></div>
              <div className="h-12 bg-white/10 rounded w-full mb-4"></div>
              <div className="h-10 bg-red-500/20 rounded-lg w-32"></div>
            </div>
          </div>

          {/* Right Column - Tabs Skeleton */}
          <div className="col-span-2 overflow-hidden">
            <div className="glass rounded-2xl p-6 h-full flex flex-col animate-pulse">
              {/* Tab Headers */}
              <div className="flex gap-6 mb-6">
                <div className="h-6 bg-white/10 rounded w-32"></div>
                <div className="h-6 bg-white/10 rounded w-24"></div>
              </div>

              {/* Tab Content Skeleton */}
              <div className="flex-1">
                {/* Filters Skeleton */}
                <div className="mb-4 pb-4 border-b border-white/10">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-20"></div>
                      <div className="h-10 bg-white/10 rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-28"></div>
                      <div className="h-10 bg-white/10 rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-28"></div>
                      <div className="h-10 bg-white/10 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-white/10 rounded-lg w-28"></div>
                </div>

                {/* Content List Skeleton */}
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white/5 animate-pulse"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-white/10 rounded-full"></div>
                          <div className="space-y-1">
                            <div className="h-4 bg-white/10 rounded w-48"></div>
                            <div className="h-3 bg-white/10 rounded w-32"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right space-y-1">
                            <div className="h-3 bg-white/10 rounded w-16"></div>
                            <div className="h-4 bg-white/10 rounded w-12"></div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="h-3 bg-white/10 rounded w-16"></div>
                            <div className="h-4 bg-white/10 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="h-8 bg-white/10 rounded w-32"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-white/10 rounded w-8"></div>
                    <div className="h-8 bg-white/10 rounded w-8"></div>
                    <div className="h-8 bg-white/10 rounded w-8"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
