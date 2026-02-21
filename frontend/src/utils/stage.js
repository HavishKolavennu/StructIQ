export const STAGE_COLORS = {
  complete: 'bg-stageGreen/20 text-stageGreen border-stageGreen/40',
  inspected: 'bg-stageGreen/15 text-stageGreen border-stageGreen/35',
  connected: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  braced: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  placed: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  delivered: 'bg-stageAmber/20 text-stageAmber border-stageAmber/40',
  materials_on_site: 'bg-stageAmber/20 text-stageAmber border-stageAmber/40',
  rough_in_started: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  rough_in_complete: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  pressure_tested: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  duct_installed: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  branches_complete: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  balanced: 'bg-stageBlue/20 text-stageBlue border-stageBlue/40',
  not_started: 'bg-stageGray/25 text-stageGray border-stageGray/40',
  not_captured: 'bg-stageGray/25 text-stageGray border-stageGray/40',
  unclear: 'bg-stageRed/20 text-stageRed border-stageRed/40'
}

export const CONFIDENCE_COLORS = {
  high: 'bg-stageGreen/20 text-stageGreen border-stageGreen/40',
  medium: 'bg-stageAmber/20 text-stageAmber border-stageAmber/40',
  low: 'bg-stageRed/20 text-stageRed border-stageRed/40',
  none: 'bg-stageGray/25 text-stageGray border-stageGray/40'
}

export function stageToLabel(stage) {
  return stage?.replaceAll('_', ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'
}
