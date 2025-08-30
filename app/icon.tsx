import { ImageResponse } from 'next/og'

// Route segment config
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 16,
          background: '#6C63FF',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            border: '2px solid white',
            borderRadius: '50%',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              background: 'white',
              borderRadius: '50%',
              position: 'absolute',
              top: '6px',
              left: '6px',
            }}
          />
          <div
            style={{
              width: 8,
              height: '1px',
              background: 'white',
              position: 'absolute',
              top: '8px',
              left: '2px',
            }}
          />
          <div
            style={{
              width: '1px',
              height: 8,
              background: 'white',
              position: 'absolute',
              top: '2px',
              left: '8px',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}