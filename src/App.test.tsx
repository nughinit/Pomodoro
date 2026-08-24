import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the VIA heading and tagline inside a main region', () => {
    render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'VIA' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Do plano ao feito, no seu ritmo.'),
    ).toBeInTheDocument()
  })

  it('renders the Hoje section before the focus timer in reading order', () => {
    render(<App />)

    const todaySection = screen.getByRole('heading', { name: 'Hoje' })
    const timer = screen.getByLabelText('Cronômetro de foco')

    expect(
      todaySection.compareDocumentPosition(timer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
