import { motion } from 'framer-motion'
import { cn } from '~/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 border-2',
  md: 'w-12 h-12 border-3',
  lg: 'w-16 h-16 border-4',
}

export default function LoadingSpinner({
  size = 'md',
  className,
  text = 'Chargement...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const containerClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center'

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center space-y-4">
        <motion.div
          className={cn(
            sizeClasses[size],
            'border-primary border-t-transparent rounded-full mx-auto'
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  )
}
