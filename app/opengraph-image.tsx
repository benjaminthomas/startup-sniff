import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'StartupSniff - AI-Powered Startup Ideas & Validation'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #2D6EF7 0%, #1E5EE8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2D6EF7',
              fontSize: '48px',
              fontWeight: 'bold',
              marginRight: '24px',
            }}
          >
            S
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              letterSpacing: '-2px',
            }}
          >
            StartupSniff
          </div>
        </div>
        <div
          style={{
            fontSize: '36px',
            fontWeight: '500',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: '1.4',
            opacity: 0.95,
          }}
        >
          AI-Powered Startup Ideas & Validation
        </div>
        <div
          style={{
            fontSize: '24px',
            marginTop: '32px',
            opacity: 0.85,
            textAlign: 'center',
          }}
        >
          Discover trending opportunities • Validate with AI • Build with confidence
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
