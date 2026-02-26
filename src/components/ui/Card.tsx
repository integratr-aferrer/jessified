import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
interface CardProps extends HTMLMotionProps<'div'> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}
export function Card({
  title,
  description,
  action,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}
      {...props}>

      {(title || action) &&
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            {title &&
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          }
            {description &&
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          }
          </div>
          {action && <div>{action}</div>}
        </div>
      }
      <div className="p-6">{children}</div>
    </motion.div>);

}