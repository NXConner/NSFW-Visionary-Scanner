import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export function GrowersVsShowersKnowledge() {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="what-it-means">
        <AccordionTrigger>What “Grower vs Shower” means (in plain language)</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-2">
          <p>
            It’s a <strong>change pattern</strong>: how much size typically changes from flaccid →
            erect. It’s not a judgment, not a diagnosis, and not a guarantee about performance or
            satisfaction.
          </p>
          <p>
            Two people can have the <strong>same erect size</strong> while having very different
            flaccid sizes. That’s why flaccid comparisons can be misleading without context.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="how-it-works">
        <AccordionTrigger>How “Growers vs Showers” is calculated</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This feature compares your <strong>average flaccid</strong> vs{" "}
            <strong>average erect</strong> measurements (length and girth), then computes the deltas
            (cm and %). Classification is based on <strong>length delta</strong> to keep it simple
            and transparent.
          </p>
          <p>
            Best accuracy comes from <Badge variant="outline">paired</Badge> entries (logging
            flaccid + erect together) and using a consistent measurement protocol.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="materials">
        <AccordionTrigger>Measurement toolkit (materials)</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Flexible tape measure (preferred for girth/circumference).</li>
            <li>Rigid ruler (preferred for length).</li>
            <li>Optional: soft tailor’s tape + a straight edge for cleaner length alignment.</li>
            <li>
              Optional: note-taking (protocol, time-of-day, temperature, hydration/stress context).
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="protocol">
        <AccordionTrigger>Protocol consistency (what changes results)</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Bone-pressed vs non-bone-pressed length is not interchangeable—pick one and stick to
              it.
            </li>
            <li>Same position each time (standing vs sitting vs lying) improves comparability.</li>
            <li>Use the same tool and tension on tape for girth (avoid pulling tight).</li>
            <li>
              Log “paired” entries close together in time for the cleanest grower/shower signal.
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="cold-shrinkage">
        <AccordionTrigger>Cold shrinkage: why some growers look tiny when flaccid</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Many people notice that in cold temperatures (or when stressed), the flaccid state can
            retract and look dramatically smaller. This is common physiology:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Cold/stress increases <strong>sympathetic nervous system</strong> tone and causes{" "}
              <strong>vasoconstriction</strong>.
            </li>
            <li>
              The <strong>cremaster/dartos</strong> response can increase retraction/tightness in
              the genital area.
            </li>
            <li>
              This can reduce flaccid size temporarily, especially for people who “grow” more
              between states.
            </li>
          </ul>
          <p>
            Important: a small flaccid size in the cold does <strong>not</strong> prevent someone
            from reaching an average-or-above erect size. The erect state depends more on blood
            flow/erection quality and tissue capacity than on the cold baseline snapshot.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="factors">
        <AccordionTrigger>Context factors you can track (optional)</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-2">
          <p>
            If you choose to log context, these are common variables that can affect measurements
            and help explain day-to-day variation:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Time-of-day, ambient temperature.</li>
            <li>Arousal score / erection quality (subjective).</li>
            <li>Hydration, sleep, stress.</li>
            <li>Recent exercise, pumping, edging, ejaculation timing.</li>
            <li>Caffeine/alcohol/nicotine (optional).</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="pros-cons">
        <AccordionTrigger>Pros & cons (practical, non-judgmental)</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Neither pattern is “better.” Here are the most common real-world pros/cons people
            report:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Showers</strong>: flaccid appearance can look more consistent across
              situations; changes may feel less dramatic.
            </li>
            <li>
              <strong>Growers</strong>: flaccid appearance can vary a lot (especially with
              cold/stress) but can still reach similar erect dimensions; the change can feel more
              dramatic and may reduce worry once tracked consistently.
            </li>
            <li>
              <strong>Both</strong>: erection quality, comfort, and communication matter more than
              labels for most partners.
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="privacy">
        <AccordionTrigger>Privacy note</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This dashboard uses your saved measurements. Keep notes minimal if you plan to
            export/share backups.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
