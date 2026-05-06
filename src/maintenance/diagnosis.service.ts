import { Injectable } from '@nestjs/common';
import { DamageSeverity } from '@prisma/client';

@Injectable()
export class DiagnosisService {

  /*
  ========================================
  AI PHOTO DIAGNOSIS (SIMULATED)
  ========================================
  */

  async analyzePhotos(photoUrls: string[]) {

    if (!photoUrls || photoUrls.length === 0) {
      return {
        severity: DamageSeverity.MINOR,
        recommendation: 'No visible damage detected'
      };
    }

    const url = photoUrls[0].toLowerCase();

    /*
    ========================================
    SIMPLE HEURISTIC AI (REPLACE WITH REAL AI LATER)
    ========================================
    */

    if (url.includes('leak') || url.includes('water')) {
      return {
        severity: DamageSeverity.MODERATE,
        recommendation: 'Possible plumbing leak detected. Inspection recommended.'
      };
    }

    if (url.includes('spark') || url.includes('burn') || url.includes('wire')) {
      return {
        severity: DamageSeverity.CRITICAL,
        recommendation: 'Electrical hazard detected. Immediate repair required.'
      };
    }

    if (url.includes('crack') || url.includes('hole')) {
      return {
        severity: DamageSeverity.MAJOR,
        recommendation: 'Structural damage likely. Professional inspection required.'
      };
    }

    if (url.includes('dirty') || url.includes('dust')) {
      return {
        severity: DamageSeverity.MINOR,
        recommendation: 'Cleaning or minor maintenance recommended.'
      };
    }

    /*
    ========================================
    DEFAULT CASE
    ========================================
    */

    return {
      severity: DamageSeverity.MINOR,
      recommendation: 'Minor issue detected. Standard maintenance recommended.'
    };

  }

}