import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PostMediaItem } from './post-media-item'
import type { PostMedia } from '../types/post-media'

type PostMediaModalProps = {
  media: PostMedia[]
  initialIndex: number
  onClose: () => void
}

export function PostMediaModal({ media, initialIndex, onClose }: PostMediaModalProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const handleCarouselApi = (api: CarouselApi) => {
    setCarouselApi(api)
  }

  useEffect(() => {
    if (!carouselApi) return

    carouselApi.scrollTo(initialIndex, true)
    setActiveIndex(initialIndex)

    const updateActiveIndex = () => {
      setActiveIndex(carouselApi.selectedScrollSnap())
    }
    carouselApi.on('select', updateActiveIndex)
    return () => {
      carouselApi.off('select', updateActiveIndex)
    }
  }, [carouselApi, initialIndex])

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(96vw,64rem)] max-w-none gap-3 border-0 bg-transparent p-0 text-background shadow-none ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">Post media viewer</DialogTitle>
        <DialogClose
          render={
            <Button
              variant="secondary"
              size="icon-lg"
              aria-label="Close media viewer"
              className="absolute right-1 top-2 z-20"
            />
          }
        >
          <span aria-hidden="true">×</span>
        </DialogClose>
        <Carousel setApi={handleCarouselApi} opts={{ startIndex: initialIndex }} className="mx-12">
          <CarouselContent className="ml-0">
            {media.map((item) => (
              <CarouselItem key={item.assetId} className="pl-0">
                <div className="flex h-[min(78dvh,48rem)] items-center justify-center overflow-hidden rounded-xl bg-foreground/90">
                  <PostMediaItem
                    media={item}
                    controls={item.type === 'VIDEO'}
                    className="h-full max-h-[78dvh] w-full object-contain"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {media.length > 1 && (
            <>
              <CarouselPrevious
                aria-label="Previous media"
                className="left-[-4rem] z-10 h-12 w-12 bg-background text-foreground hover:bg-muted"
              />
              <CarouselNext
                aria-label="Next media"
                className="right-[-4rem] z-10 h-12 w-12 bg-background text-foreground hover:bg-muted"
              />
            </>
          )}
        </Carousel>
        <p aria-live="polite" className="text-center text-sm font-medium">
          {activeIndex + 1} / {media.length}
        </p>
      </DialogContent>
    </Dialog>
  )
}
