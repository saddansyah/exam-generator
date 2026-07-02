import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Activity, 
  Play, 
  Moon, 
  Sun, 
  TrendingUp, 
  Zap, 
  Award,
  Clock
} from 'lucide-react'
import { getExamHistory, getOverallStats } from '@/lib/storage'
import type { ExamRun } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [history, setHistory] = useState<ExamRun[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setHistory(getExamHistory("odd-even"))
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark'
    if (isDark) {
      document.documentElement.classList.add('dark')
      setTheme('dark')
    } else {
      document.documentElement.classList.remove('dark')
      setTheme('light')
    }
  }, [])

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setTheme('dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setTheme('light')
    }
  }

  const stats = getOverallStats("odd-even")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <div>
              <h1 className="text-base font-bold tracking-tight">Exam & Drill Generator</h1>
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Practice cognitive assessments and track performance stats.</p>
        </div>

        {/* Aggregate Stats Cards */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Drills</span>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.totalRuns}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Avg Accuracy</span>
                <Award className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.avgAccuracy}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Avg Consistency</span>
                <Activity className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.avgConsistency}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Avg Speed</span>
                <Zap className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.avgSpeed} <span className="text-xs font-normal text-muted-foreground">QPM</span></div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available Drills Grid */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight">Available Drills</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Odd-Even drill card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Odd-Even Test
                </CardTitle>
                <CardDescription>
                  Decide whether the sum of two random numbers is odd (1) or even (0). Measures processing speed and focus cadence.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex gap-2">
                <Link
                  to="/exam/odd-even"
                  search={{
                    stage: 'config',
                    duration: 30,
                    sessions: 3,
                    currentSession: 1
                  }}
                  className="flex-1"
                >
                  <Button className="w-full gap-2 font-medium">
                    <Play className="size-4 fill-current" />
                    Start Drill
                  </Button>
                </Link>
                <Link to="/history/odd-even">
                  <Button variant="outline" size="icon" title="History">
                    <Clock className="size-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

          </div>
        </section>

      </main>
    </div>
  )
}
