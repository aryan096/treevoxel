import styles from './AboutPanel.module.css';

const REFERENCES = [
  {
    title:
      'Barthelemy and Caraglio, Plant Architecture: A Dynamic, Multilevel and Comprehensive Approach to Plant Form, Structure and Ontogeny (2007)',
    href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2802949/',
  },
  {
    title: 'Jucker et al., Tallo: A global tree allometry and crown architecture database (2022)',
    href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9542605/',
  },
  {
    title: 'Prusinkiewicz and Lindenmayer, The Algorithmic Beauty of Plants',
    href: 'https://algorithmicbotany.org/papers/',
  },
  {
    title: 'Runions, Lane, Prusinkiewicz, Modeling Trees with a Space Colonization Algorithm (2007)',
    href: 'https://algorithmicbotany.org/papers/colonization.egwnp2007.html',
  },
  {
    title: 'Faithful 32x Resource Pack by Faithful Team',
    href: 'https://faithfulpack.net/',
  },
] as const;

export default function AboutPanel() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>About</span>
        <p className={styles.copy}>
          Treevoxel is a tool for visualizing and creating 3D tree models, but also just a fun toy to play with, created parimarily to help me build better trees in Minecraft. The source for this website lives on{' '}
          <a
            className={styles.inlineLink}
            href="https://github.com/aryan096/treevoxel"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
          Feel free to contribute or report any issues you find there.
        </p>
      </div>

      <section className={styles.section} aria-labelledby="about-references-title">
        <h2 id="about-references-title" className={styles.sectionTitle}>
          References
        </h2>
        <ol className={styles.referenceList}>
          {REFERENCES.map((reference) => (
            <li key={reference.href} className={styles.referenceItem}>
              <a className={styles.referenceLink} href={reference.href} target="_blank" rel="noreferrer">
                {reference.title}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
