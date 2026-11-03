\version "2.24.0"
% Parallel 3rds survive Jv = −7. Shifting voice I down an octave puts it
% below voice II, and the 3rds become 6ths.
\header { tagline = ##f }
\paper { indent = 0 }
\score {
  <<
    \new Staff \with { instrumentName = "I" } {
      \clef treble \time 4/4
      e''2^"original" f'' g''1 \bar "||"
      e'2^"Jv = −7" f' g'1 \bar "|."
    }
    \new Staff \with { instrumentName = "II" } {
      \clef treble \time 4/4
      c''2 d'' e''1 c''2 d'' e''1
    }
  >>
  \layout { }
  \midi { }
}
