## Packages
date-fns | Formatting dates for sales and dashboard
recharts | Optional dashboard charting (if needed)
lucide-react | Icons for the POS and dashboard
react-hook-form | Form state management
@hookform/resolvers | Zod validation for forms
zod | Schema validation

## Notes
- Tailwind Config - extend fontFamily:
  fontFamily: {
    sans: ["var(--font-sans)"],
    display: ["var(--font-display)"],
  }
- Assuming standard shadcn components are available in `@/components/ui/*`.
- Layout uses CSS grid/flex for a split-pane Point of Sale (POS) view.
