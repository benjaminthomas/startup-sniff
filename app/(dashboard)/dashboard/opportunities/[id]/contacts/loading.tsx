import { Skeleton } from '@/components/ui/skeleton'

export default function ContactsLoading() {
  return (
    <>
      {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-full max-w-2xl mb-4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        {/* Status Banner Skeleton */}
        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Discovering Contacts</h3>
            <p className="text-sm text-gray-600">
              Finding Reddit users who posted about this pain point...
            </p>
          </div>
        </div>

        {/* Contact Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              <Skeleton className="h-20 w-full mb-4 rounded" />

              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded" />
                <Skeleton className="h-10 flex-1 rounded" />
              </div>
            </div>
          ))}
        </div>
    </>
  )
}
