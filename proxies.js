export const aiProxies = [
  {
    path: '/claudeai',
    target: 'https://api.anthropic.com',
  },
  {
    path: '/openai',
    target: 'https://api.openai.com',
  },
]

export const drawProxies = [
  {
    path: '/sddraw',
    target: 'https://api.stabilydraw.com',
  },
  {
    path: '/mjdraw/v1',
    target: 'https://api.midjdraw.com/v1/xxx',
  },
]

export default {
  ai: aiProxies,
  draw: drawProxies,
}
