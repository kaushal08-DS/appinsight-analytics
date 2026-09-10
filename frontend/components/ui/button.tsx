import * as React from 'react'; import {cn} from '../../lib/utils';
export function Button({className,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>){return <button className={cn('inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2',className)} {...props}/>}
