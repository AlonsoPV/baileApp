import React from 'react';
import { usePictureInPicture } from '@/hooks/usePictureInPicture';
import { useTranslation } from 'react-i18next';

interface VideoPlayerWithPiPProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  controls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  controlsList?: string;
  poster?: string;
  aspectRatio?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  'aria-label'?: string;
}

/**
 * Componente de reproductor de video con soporte para Picture-in-Picture (PiP)
 * 
 * Envuelve el elemento <video> HTML5 nativo y agrega un botón para activar PiP
 * cuando está disponible en el navegador.
 */
export const VideoPlayerWithPiP: React.FC<VideoPlayerWithPiPProps> = ({
  src,
  className = '',
  style = {},
  controls = true,
  preload = 'metadata',
  controlsList,
  poster,
  aspectRatio,
  onPlay,
  onPause,
  onEnded,
  'aria-label': ariaLabel,
}) => {
  const { t } = useTranslation();
  const { isSupported, isPictureInPicture, togglePictureInPicture, videoRef } = usePictureInPicture();

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    ...style,
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    ...(aspectRatio ? { aspectRatio } : {}),
  };

  return (
    <>
      <style>{`
        .pip-video-container {
          position: relative;
          width: 100%;
        }
        .pip-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.7));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          padding: 0.5rem 0.75rem;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }
        .pip-button:hover {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.85));
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
        }
        .pip-button:active {
          transform: translateY(0);
        }
        .pip-button.active {
          background: linear-gradient(135deg, rgba(229, 57, 53, 0.9), rgba(244, 67, 54, 0.9));
          border-color: rgba(229, 57, 53, 0.6);
        }
        .pip-button-icon {
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 768px) {
          .pip-button {
            top: 0.75rem;
            right: 0.75rem;
            padding: 0.4rem 0.6rem;
            font-size: 0.8rem;
          }
        }
        @media (max-width: 480px) {
          .pip-button {
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.35rem 0.5rem;
            font-size: 0.75rem;
          }
          .pip-button span:not(.pip-button-icon) {
            display: none;
          }
        }
      `}</style>
      <div className="pip-video-container" style={containerStyle}>
        <video
          ref={videoRef}
          src={src}
          className={className}
          style={videoStyle}
          controls={controls}
          preload={preload}
          controlsList={controlsList}
          poster={poster}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          aria-label={ariaLabel}
        />
        {isSupported && (
          <button
            type="button"
            className={`pip-button ${isPictureInPicture ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              togglePictureInPicture();
            }}
            aria-label={isPictureInPicture ? t('exit_picture_in_picture') : t('enter_picture_in_picture')}
            title={isPictureInPicture ? t('exit_picture_in_picture') : t('enter_picture_in_picture')}
          >
            <span className="pip-button-icon">
              {isPictureInPicture ? '🔲' : '🔳'}
            </span>
            <span>{isPictureInPicture ? t('exit_pip') : t('enter_pip')}</span>
          </button>
        )}
      </div>
    </>
  );
};

