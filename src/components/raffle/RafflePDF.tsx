'use client';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Prize, Raffle } from '@/types';

interface Props {
  raffle: Raffle;
  prizes: Prize[];
  qrDataUrl: string;
  logoUrl: string;
  username: string;
}

const C = {
  violet: '#7C3AED',
  violetLight: '#EDE9FE',
  dark: '#09090B',
  text: '#18181B',
  sub: '#52525B',
  muted: '#71717A',
  border: '#E4E4E7',
  surface: '#F4F4F5',
  imageBg: '#E4E4E7',
  gold: '#B45309',
  white: '#FFFFFF',
};

const ORDINALS = ['1er', '2do', '3er', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo'];

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingHorizontal: 40,
    paddingTop: 34,
    paddingBottom: 52,
    fontFamily: 'Helvetica',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.violet,
    borderBottomStyle: 'solid',
  },
  logoImg: {
    height: 48,
    width: 'auto',
    objectFit: 'contain',
    marginBottom: 2,
  },
  logoSub: {
    fontSize: 8.5,
    color: C.muted,
    marginTop: 3,
    letterSpacing: 1,
  },

  // ── Raffle info ──────────────────────────────────────────────────────────────
  raffleTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 8,
    lineHeight: 1.2,
  },
  description: {
    fontSize: 10,
    color: C.sub,
    lineHeight: 1.55,
    marginBottom: 16,
  },

  // ── Details + QR ────────────────────────────────────────────────────────────
  infoQrRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  infoGrid: {
    flex: 1,
    paddingRight: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  infoLabel: {
    fontSize: 9,
    color: C.muted,
    width: 120,
  },
  infoValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    flex: 1,
  },
  qrBox: {
    width: 104,
    alignItems: 'center',
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrLabel: {
    fontSize: 7,
    color: C.muted,
    marginTop: 5,
    textAlign: 'center',
  },
  qrUrl: {
    fontSize: 6.5,
    color: C.violet,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Prizes ──────────────────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 10,
    paddingTop: 14,
    borderTopWidth: 0.75,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
  },
  prizeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  prizeCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 6,
    overflow: 'hidden',
  },
  prizeImageBox: {
    backgroundColor: C.imageBg,
    width: '100%',
    height: 108,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeImg: {
    width: '100%',
    height: 108,
    objectFit: 'contain',
  },
  prizeBody: {
    padding: 8,
  },
  prizeOrdinal: {
    fontSize: 7.5,
    color: C.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  prizeTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    lineHeight: 1.3,
  },
  prizeDesc: {
    fontSize: 8,
    color: C.sub,
    marginTop: 3,
    lineHeight: 1.4,
  },
  prizeWinner: {
    fontSize: 8,
    color: C.gold,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 7.5,
    color: C.muted,
  },
  footerRight: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.violet,
    letterSpacing: 1,
  },
});

export function RafflePDFDocument({ raffle, prizes, qrDataUrl, logoUrl, username }: Props) {
  const publicUrl = `rifando.app/${username}/${raffle.slug}`;
  const sorted = [...prizes].sort((a, b) => a.position - b.position);

  // Chunk prizes into rows of 3
  const rows: Prize[][] = [];
  for (let i = 0; i < sorted.length; i += 3) {
    rows.push(sorted.slice(i, i + 3));
  }

  return (
    <Document title={raffle.title} author="Rifando" creator="rifando.app">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Image src={logoUrl} style={s.logoImg} />
          <Text style={s.logoSub}>Tu plataforma de rifas online</Text>
        </View>

        {/* ── Title ── */}
        <Text style={s.raffleTitle}>{raffle.title}</Text>

        {/* ── Description ── */}
        {raffle.description ? (
          <Text style={s.description}>{raffle.description}</Text>
        ) : null}

        {/* ── Details + QR ── */}
        <View style={s.infoQrRow}>
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Precio por numero</Text>
              <Text style={s.infoValue}>{formatCurrency(raffle.price_per_number)}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Total de numeros</Text>
              <Text style={s.infoValue}>{raffle.total_numbers}</Text>
            </View>
            {raffle.draw_date ? (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Fecha de sorteo</Text>
                <Text style={s.infoValue}>{formatDate(raffle.draw_date)}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.qrBox}>
            <Image src={qrDataUrl} style={s.qrImage} />
            <Text style={s.qrLabel}>Escaneá para participar</Text>
            <Text style={s.qrUrl}>{publicUrl}</Text>
          </View>
        </View>

        {/* ── Prizes ── */}
        {sorted.length > 0 ? (
          <>
            <Text style={s.sectionHeading}>Premios</Text>
            {rows.map((row, ri) => (
              <View key={ri} style={s.prizeRow}>
                {Array.from({ length: 3 }).map((_, ci) => {
                  const prize = row[ci];
                  const globalIdx = ri * 3 + ci;
                  const marginRight = ci < 2 ? 10 : 0;

                  if (!prize) {
                    // Empty placeholder to keep grid alignment
                    return <View key={`ph-${ci}`} style={{ flex: 1, marginRight }} />;
                  }

                  return (
                    <View key={prize.id} style={[s.prizeCard, { marginRight }]}>
                      {prize.image_url ? (
                        <Image src={prize.image_url} style={s.prizeImg} />
                      ) : (
                        <View style={s.prizeImageBox} />
                      )}
                      <View style={s.prizeBody}>
                        <Text style={s.prizeOrdinal}>
                          {ORDINALS[globalIdx] ?? `${globalIdx + 1}o`} premio
                        </Text>
                        <Text style={s.prizeTitle}>{prize.title}</Text>
                        {prize.description ? (
                          <Text style={s.prizeDesc}>{prize.description}</Text>
                        ) : null}
                        {prize.winner_number !== null ? (
                          <Text style={s.prizeWinner}>Ganador: #{prize.winner_number}</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        ) : null}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>Generado por Rifando · rifando.app</Text>
          <Image src={logoUrl} style={{ height: 16, width: 'auto', objectFit: 'contain' }} />
        </View>
      </Page>
    </Document>
  );
}
